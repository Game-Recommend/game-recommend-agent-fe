import { NextResponse } from "next/server";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/** 백엔드가 검사하는 공유 비밀 키 헤더. 백엔드 설정과 이름이 같아야 합니다. */
const API_KEY_HEADER = "X-API-Key";

/**
 * 백엔드 응답을 기다리는 최대 시간. JSON 응답은 본문까지, SSE 응답은 스트림이 열릴 때(응답 헤더)까지 적용합니다.
 * Route Handler의 maxDuration보다 짧아야 합니다.
 */
const UPSTREAM_TIMEOUT_MS = 55_000;

const SSE_MEDIA_TYPE = "text/event-stream";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * 프록시가 직접 만드는 오류 문장. 브라우저의 오류 패널에 그대로 뜨므로 요청한 언어로 고른다.
 * 백엔드가 만든 문장은 여기서 손대지 않고 그대로 흘려보낸다.
 */
const KO_MESSAGES = {
  invalidJson: "요청 본문은 JSON이어야 합니다.",
  invalidQuestion: "question은 비어 있지 않은 문자열이어야 합니다.",
  questionTooLong: (max: number) => `question은 ${max}자 이하여야 합니다.`,
  invalidLanguage: (locales: string) => `language는 ${locales} 중 하나여야 합니다.`,
  missingBackendUrl: "백엔드 주소가 설정되지 않았습니다.",
  badAuth: "백엔드 인증 설정에 문제가 있습니다.",
  badResponse: "백엔드 응답을 처리할 수 없습니다.",
  timeout: "백엔드 응답이 지연되고 있습니다.",
  unreachable: "백엔드에 연결할 수 없습니다.",
};

type ProxyMessages = typeof KO_MESSAGES;

const EN_MESSAGES: ProxyMessages = {
  invalidJson: "The request body must be JSON.",
  invalidQuestion: "question must be a non-empty string.",
  questionTooLong: (max: number) => `question must be ${max} characters or fewer.`,
  invalidLanguage: (locales: string) => `language must be one of ${locales}.`,
  missingBackendUrl: "The backend address is not configured.",
  badAuth: "The backend authentication setup is wrong.",
  badResponse: "The backend response could not be handled.",
  timeout: "The backend is taking too long to respond.",
  unreachable: "The backend could not be reached.",
};

/** 요청이 언어를 밝히지 않았으면 기본 언어로 답한다. */
export function proxyMessages(locale: Locale = DEFAULT_LOCALE): ProxyMessages {
  return locale === "en" ? EN_MESSAGES : KO_MESSAGES;
}

type UpstreamRequest = {
  method: "GET" | "POST";
  /** JSON으로 직렬화해 보낼 본문 */
  body?: unknown;
  /**
   * true면 `Accept: text/event-stream`으로 요청합니다. 백엔드가 SSE로 응답하면 본문을 버퍼링하지 않고
   * 그대로 흘려보내고, JSON으로 응답하면(스트림 전 오류, SSE를 지원하지 않는 백엔드) JSON 경로와 같이 처리합니다.
   */
  stream?: boolean;
  /** 브라우저 요청의 signal. 브라우저가 연결을 끊으면 백엔드 호출도 중단해 파이프라인이 취소되게 합니다. */
  signal?: AbortSignal;
  /** 프록시가 자기 오류 문장을 고를 언어. 백엔드가 만든 문장은 이 값과 무관합니다. */
  locale?: Locale;
};

/** 프록시가 직접 만드는 오류 응답. FastAPI와 같은 `{ detail }` 형태를 사용합니다. */
export function errorResponse(status: number, detail: string) {
  return NextResponse.json({ detail }, { status, headers: NO_STORE });
}

/**
 * 백엔드 API를 서버에서 호출하고 응답을 그대로 브라우저에 전달합니다.
 * 백엔드 주소와 키는 서버 환경 변수에서만 읽으며 응답에 포함되지 않습니다.
 * 브라우저가 보낸 쿠키·헤더는 백엔드로 전달하지 않습니다.
 */
export async function proxyToBackend(path: string, init: UpstreamRequest): Promise<Response> {
  const messages = proxyMessages(init.locale);
  const baseUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    console.error("BACKEND_API_URL 환경 변수가 비어 있습니다.");
    return errorResponse(500, messages.missingBackendUrl);
  }

  const headers = new Headers({ Accept: init.stream ? SSE_MEDIA_TYPE : "application/json" });
  const apiKey = process.env.BACKEND_API_KEY;
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  // 시간 제한과 브라우저 연결 끊김을 하나의 signal로 묶어 백엔드 호출을 중단합니다.
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("백엔드 응답 시간 초과", "TimeoutError")),
    UPSTREAM_TIMEOUT_MS,
  );
  const abortFromClient = () => controller.abort(init.signal?.reason);
  init.signal?.addEventListener("abort", abortFromClient, { once: true });
  const release = () => {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abortFromClient);
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    release();
    return failureResponse(error, init, path);
  }

  if (upstream.status === 401 || upstream.status === 403) {
    release();
    void upstream.body?.cancel();
    console.error(
      `백엔드 인증 실패 (${upstream.status}). BACKEND_API_KEY가 백엔드의 키와 같은지 확인하세요.`,
    );
    return errorResponse(502, messages.badAuth);
  }

  const contentType = upstream.headers.get("content-type") ?? "";

  if (init.stream && contentType.includes(SSE_MEDIA_TYPE) && upstream.body) {
    // 스트림은 백엔드가 닫을 때까지 이어지므로 헤더 시간 제한만 풀고, 브라우저 연결 끊김은 계속 감시합니다.
    // 본문은 변환 없이 그대로 흘려보내 진행 이벤트가 즉시 브라우저에 닿게 합니다.
    clearTimeout(timer);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": `${SSE_MEDIA_TYPE}; charset=utf-8`,
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }

  let body: string;
  try {
    body = await upstream.text();
  } catch (error) {
    release();
    return failureResponse(error, init, path);
  }
  release();

  if (!contentType.includes("application/json")) {
    console.error(
      `백엔드가 JSON이 아닌 응답을 보냈습니다 (${upstream.status}, ${contentType || "content-type 없음"}).`,
    );
    return errorResponse(502, messages.badResponse);
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE },
  });
}

/** 백엔드 호출이나 본문 읽기가 실패했을 때의 응답 */
function failureResponse(error: unknown, init: UpstreamRequest, path: string) {
  // 브라우저가 먼저 끊은 경우는 응답을 받을 곳이 없으므로 오류로 기록하지 않습니다.
  if (init.signal?.aborted) return new Response(null, { status: 499 });
  const messages = proxyMessages(init.locale);
  const timedOut = error instanceof Error && error.name === "TimeoutError";
  console.error(`백엔드 호출 실패 (${init.method} ${path}):`, error);
  return timedOut ? errorResponse(504, messages.timeout) : errorResponse(502, messages.unreachable);
}
