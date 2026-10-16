import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev가 AI 에이전트를 감지하면 AGENTS.md·CLAUDE.md를 프로젝트 루트에 만든다. 끄면 만들지 않는다.
  agentRules: false,
};

// BotID의 확인 스크립트와 요청을 이 앱 주소로 중계한다. 다른 도메인이면 광고 차단기에 막힐 수 있다.
export default withBotId(nextConfig);
