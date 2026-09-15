import type { RecommendationResponse, StageEvent } from "@/lib/recommendation";
import { readSseMessages } from "@/lib/sse";

/** 프록시·백엔드가 돌려준 `detail` 문장을 그대로 사용자에게 보여주는 오류 */
export class RecommendationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RecommendationError";
  }
}

const STREAM_INTERRUPTED = "추천이 끝나기 전에 연결이 끊겼습니다. 다시 시도해 주세요.";

export type RecommendationOptions = {
  /** SSE `stage` 이벤트마다 호출됩니다. JSON으로 응답하는 백엔드에서는 호출되지 않습니다. */
  onStage?: (event: StageEvent) => void;
  /** 중단하면 fetch가 끊기고 프록시가 백엔드 호출도 취소해 파이프라인이 멈춥니다. */
  signal?: AbortSignal;
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
export const requestRecommendation: RecommendationRequester = async (question, { onStage, signal } = {}) => {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question }),
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new RecommendationError(
        detailOf(payload) ?? `추천 요청에 실패했습니다. (${response.status})`,
        response.status,
      );
    }
    if (!isRecommendation(payload)) throw new RecommendationError("추천 응답 형식이 올바르지 않습니다.");
    return payload;
  }

  if (!response.body) throw new RecommendationError("추천 응답 본문이 비어 있습니다.");

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
          if (!isRecommendation(result)) throw new RecommendationError("추천 응답 형식이 올바르지 않습니다.");
          return result;
        }
        case "error":
          throw new RecommendationError(
            detailOf(parseJson(message.data)) ?? "추천 처리 중 오류가 발생했습니다.",
          );
        default:
          break; // 알 수 없는 이벤트는 무시한다
      }
    }
  } catch (error) {
    // 스트림이 중간에 끊기면 본문 읽기가 네트워크 오류로 실패한다. 취소(AbortError)는 호출자가 구분하므로 그대로 둔다.
    if (error instanceof RecommendationError || signal?.aborted) throw error;
    throw new RecommendationError(STREAM_INTERRUPTED);
  }
  throw new RecommendationError(STREAM_INTERRUPTED);
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
