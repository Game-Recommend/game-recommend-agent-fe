import type { Locale } from "@/lib/i18n";
import type { RecommendationResponse, StageEvent } from "@/lib/recommendation";
import { readSseMessages } from "@/lib/sse";

/**
 * 프론트가 만드는 오류의 이름. 화면이 고른 언어로 문장을 골라 쓰도록 문장 대신 이 이름을 던진다.
 * 프록시·백엔드가 돌려준 문장은 detail에 그대로 담는다. 그 문장의 언어는 백엔드가 정한다.
 */
export type RecommendationErrorCode =
  | "requestFailed"
  | "invalidPayload"
  | "emptyBody"
  | "streamInterrupted"
  | "pipelineFailed";

export class RecommendationError extends Error {
  constructor(
    readonly code: RecommendationErrorCode,
    readonly detail: string | null = null,
    readonly status?: number,
  ) {
    super(detail ?? code);
    this.name = "RecommendationError";
  }
}

export type RecommendationOptions = {
  /** SSE `stage` 이벤트마다 호출됩니다. JSON으로 응답하는 백엔드에서는 호출되지 않습니다. */
  onStage?: (event: StageEvent) => void;
  /** 중단하면 fetch가 끊기고 프록시가 백엔드 호출도 취소해 파이프라인이 멈춥니다. */
  signal?: AbortSignal;
  /**
   * 답변·리뷰 요약을 어떤 언어로 받을지. 프록시가 자기 오류 문장을 고르는 데 쓰고 백엔드로 넘깁니다.
   * 백엔드가 아직 이 값을 읽지 않으면 무시되고 한국어로 돌아옵니다.
   */
  language?: Locale;
};

export type RecommendationRequester = (
  question: string,
  options?: RecommendationOptions,
) => Promise<RecommendationResponse>;

/**
 * `POST /api/recommend`를 호출합니다.
 * 프록시가 SSE(`text/event-stream`)로 응답하면 `stage` 이벤트를 onStage로 넘기고 `result` 본문을 돌려줍니다.
 * JSON으로 응답하면(오류 응답이거나 SSE를 지원하지 않는 백엔드) 그대로 해석합니다.
 */
export const requestRecommendation: RecommendationRequester = async (
  question,
  { onStage, signal, language } = {},
) => {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(language === undefined ? { question } : { question, language }),
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new RecommendationError("requestFailed", detailOf(payload) ?? null, response.status);
    }
    if (!isRecommendation(payload)) throw new RecommendationError("invalidPayload");
    return payload;
  }

  if (!response.body) throw new RecommendationError("emptyBody");

  try {
    for await (const message of readSseMessages(response.body)) {
      switch (message.event) {
        case "stage": {
          const stage = parseStage(parseJson(message.data));
          if (stage) onStage?.(stage);
          break;
        }
        case "result": {
          const payload = parseJson(message.data);
          const result = isRecord(payload) ? payload.result : undefined;
          if (!isRecommendation(result)) throw new RecommendationError("invalidPayload");
          return result;
        }
        case "error":
          throw new RecommendationError(
            "pipelineFailed",
            detailOf(parseJson(message.data)) ?? null,
          );
        default:
          break; // 알 수 없는 이벤트는 무시한다
      }
    }
  } catch (error) {
    // 스트림이 중간에 끊기면 본문 읽기가 네트워크 오류로 실패한다. 취소(AbortError)는 호출자가 구분하므로 그대로 둔다.
    if (error instanceof RecommendationError || signal?.aborted) throw error;
    throw new RecommendationError("streamInterrupted");
  }
  throw new RecommendationError("streamInterrupted");
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecommendation(value: unknown): value is RecommendationResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.games) &&
    Array.isArray(value.excluded_games) &&
    Array.isArray(value.warnings) &&
    typeof value.answer === "string"
  );
}

function parseStage(value: unknown): StageEvent | null {
  if (!isRecord(value) || typeof value.stage !== "string") return null;
  const { status } = value;
  if (status !== "started" && status !== "completed" && status !== "failed") return null;
  return {
    event: "stage",
    stage: value.stage,
    status,
    detail: typeof value.detail === "string" ? value.detail : null,
  };
}

/** FastAPI 오류 본문의 detail. 422는 detail이 항목 배열이라 메시지만 이어 붙입니다. */
function detailOf(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const { detail } = payload;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return undefined;
  const messages = detail
    .map((item) => (isRecord(item) && typeof item.msg === "string" ? item.msg : null))
    .filter((message): message is string => message !== null);
  return messages.length > 0 ? messages.join(" ") : undefined;
}
