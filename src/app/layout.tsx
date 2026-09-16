import type { Metadata, Viewport } from "next";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@/styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Recommend",
  description: "취향과 환경에 맞는 다음 게임을 찾아보세요.",
};

export const viewport: Viewport = {
  themeColor: "#1a1c1a", // --color-bg
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
