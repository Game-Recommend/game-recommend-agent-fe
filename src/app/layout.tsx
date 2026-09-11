import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Recommend",
  description: "취향과 환경에 맞는 다음 게임을 찾아보세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
