import { NextResponse } from "next/server";

/** 백엔드가 검사하는 공유 비밀 키 헤더. 백엔드 설정과 이름이 같아야 합니다. */
const API_KEY_HEADER = "X-API-Key";

/** 백엔드 응답을 기다리는 최대 시간. Route Handler의 maxDuration보다 짧아야 합니다. */
const UPSTREAM_TIMEOUT_MS = 55_000;

const NO_STORE = { "Cache-Control": "no-store" } as const;

type UpstreamRequest = {
  method: "GET" | "POST";
  /** JSON으로 직렬화해 보낼 본문 */
  body?: unknown;
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
  const baseUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    console.error("BACKEND_API_URL 환경 변수가 비어 있습니다.");
    return errorResponse(500, "백엔드 주소가 설정되지 않았습니다.");
  }

  const headers = new Headers({ Accept: "application/json" });
  const apiKey = process.env.BACKEND_API_KEY;
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(`백엔드 호출 실패 (${init.method} ${path}):`, error);
    return timedOut
      ? errorResponse(504, "백엔드 응답이 지연되고 있습니다.")
      : errorResponse(502, "백엔드에 연결할 수 없습니다.");
  }

  if (upstream.status === 401 || upstream.status === 403) {
    console.error(
      `백엔드 인증 실패 (${upstream.status}). BACKEND_API_KEY가 백엔드의 키와 같은지 확인하세요.`,
    );
    return errorResponse(502, "백엔드 인증 설정에 문제가 있습니다.");
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const body = await upstream.text();
  if (!contentType.includes("application/json")) {
    console.error(
      `백엔드가 JSON이 아닌 응답을 보냈습니다 (${upstream.status}, ${contentType || "content-type 없음"}).`,
    );
    return errorResponse(502, "백엔드 응답을 처리할 수 없습니다.");
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE },
  });
}
