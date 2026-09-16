import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev가 AI 에이전트를 감지하면 AGENTS.md·CLAUDE.md를 프로젝트 루트에 만든다. 끄면 만들지 않는다.
  agentRules: false,
};

export default nextConfig;
