import { proxyToBackend } from "@/lib/backend";

/** 빌드 시 정적으로 굳지 않도록 매 요청마다 백엔드를 확인합니다. */
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * 배포된 프론트 서버가 백엔드 주소·키 설정으로 연결되는지 확인할 때 사용합니다.
 */
export function GET() {
  return proxyToBackend("/health", { method: "GET" });
}
