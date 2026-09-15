import { errorResponse, proxyToBackend } from "@/lib/backend";

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
 * 요청 본문: `{ "question": "게임 추천해줘" }`
 * `Accept: text/event-stream`이면 백엔드의 SSE 진행 이벤트(`stage` … `result` 또는 `error`)를 그대로 흘려보내고,
 * 그 외에는 JSON 응답을 돌려줍니다.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "요청 본문은 JSON이어야 합니다.");
  }

  const question =
    typeof payload === "object" && payload !== null && "question" in payload
      ? payload.question
      : undefined;
  if (typeof question !== "string" || question.trim() === "") {
    return errorResponse(400, "question은 비어 있지 않은 문자열이어야 합니다.");
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(400, `question은 ${MAX_QUESTION_LENGTH}자 이하여야 합니다.`);
  }

  const stream = request.headers.get("accept")?.includes(SSE_MEDIA_TYPE) ?? false;
  return proxyToBackend("/recommend", {
    method: "POST",
    body: { question: question.trim() },
    stream,
    signal: request.signal,
  });
}
