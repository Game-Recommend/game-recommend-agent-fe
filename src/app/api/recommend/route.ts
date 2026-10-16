import { checkBotId } from "botid/server";

import { errorResponse, proxyMessages, proxyToBackend } from "@/lib/backend";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/lib/i18n";

/**
 * Vercel 함수 실행 시간 상한(초). 추천은 LLM·외부 API 호출을 포함해 오래 걸립니다.
 * SSE로 응답할 때는 스트림이 끝날 때까지 함수가 살아 있어야 하므로 스트림 전체 길이보다 길어야 합니다.
 */
export const maxDuration = 60;

const MAX_QUESTION_LENGTH = 500;

const SSE_MEDIA_TYPE = "text/event-stream";

/**
 * POST /api/recommend
 * 브라우저는 이 경로만 호출하고, 서버가 백엔드 `POST /recommend`로 전달합니다.
 * 요청 본문: `{ "question": "게임 추천해줘", "language": "ko" }`
 * `language`는 답변·리뷰 요약을 받을 언어이며 없으면 기본 언어입니다. 프록시가 자기 오류 문장을 고르는 데
 * 쓰고 백엔드로도 넘기지만, 백엔드가 아직 이 값을 읽지 않으면 무시되고 한국어 답변이 돌아옵니다.
 * `Accept: text/event-stream`이면 백엔드의 SSE 진행 이벤트(`stage` … `result` 또는 `error`)를 그대로 흘려보내고,
 * 그 외에는 JSON 응답을 돌려줍니다.
 * BotID가 브라우저가 아닌 요청(curl·스크립트)으로 판정하면 백엔드를 부르지 않고 403을 돌려줍니다.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    // 본문을 읽지 못하면 요청한 언어도 알 수 없으므로 기본 언어로 답합니다.
    return errorResponse(400, proxyMessages().invalidJson);
  }

  const body: Record<string, unknown> =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const { language } = body;
  if (language !== undefined && !isLocale(language)) {
    return errorResponse(400, proxyMessages().invalidLanguage(LOCALES.join(", ")));
  }
  const locale = language ?? DEFAULT_LOCALE;
  const messages = proxyMessages(locale);

  // 차단 문장을 요청한 언어로 고르려고 본문을 먼저 읽는다. 질문 검사보다 앞이라 봇은 400 대신 403을 받는다.
  if (await isBot()) {
    return errorResponse(403, messages.botDetected);
  }

  const { question } = body;
  if (typeof question !== "string" || question.trim() === "") {
    return errorResponse(400, messages.invalidQuestion);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(400, messages.questionTooLong(MAX_QUESTION_LENGTH));
  }

  const stream = request.headers.get("accept")?.includes(SSE_MEDIA_TYPE) ?? false;
  return proxyToBackend("/recommend", {
    method: "POST",
    body: { question: question.trim(), language: locale },
    stream,
    signal: request.signal,
    locale,
  });
}

/**
 * BotID 판정. 브라우저는 `src/instrumentation-client.ts`가 붙인 확인 헤더를 보내고, 헤더가 없거나 틀리면 봇입니다.
 * `next dev`에서는 항상 사람으로 판정합니다. 판정 자체가 실패하면(Vercel 밖에서 `npm start`, Vercel API 오류)
 * 막지 않고 기록만 남깁니다. 막으면 확인 장치가 고장 난 동안 모든 추천이 실패합니다.
 */
async function isBot(): Promise<boolean> {
  try {
    const verification = await checkBotId();
    return verification.isBot;
  } catch (error) {
    console.error("BotID 판정에 실패해 요청을 통과시킵니다:", error);
    return false;
  }
}
