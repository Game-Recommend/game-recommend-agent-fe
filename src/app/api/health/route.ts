import { proxyToBackend } from "@/lib/backend";

/** 빌드 시 정적으로 굳지 않도록 매 요청마다 백엔드를 확인합니다. */
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * 배포된 프론트 서버가 BACKEND_API_URL로 백엔드에 닿는지 확인할 때 사용합니다.
 * 백엔드의 키 검사는 POST /recommend에만 걸려 있어, 여기서는 BACKEND_API_KEY가 맞는지 알 수 없습니다.
 */
export function GET() {
  return proxyToBackend("/health", { method: "GET" });
}
