import type { Metadata, Viewport } from "next";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@/styles/tokens.css";
import "./globals.css";

const title = "Game Recommend";
const description = "취향과 환경에 맞는 다음 게임을 찾아보세요.";

/**
 * 공유 카드의 og:image·og:url은 절대 주소여야 해서 기준 주소가 필요하다.
 * Vercel이 배포마다 넣어 주는 운영 도메인을 쓰고, 로컬에는 그 값이 없으니 개발 주소로 떨어진다.
 * 프리뷰 배포도 운영 주소를 가리키는데, 공유했을 때 보이길 바라는 건 운영 화면이라 그대로 둔다.
 */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

// 썸네일 이미지는 src/app/opengraph-image.tsx가 만든다. Next가 og:image 태그를 알아서 붙이므로 여기 적지 않는다.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    url: "/",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1c1a", // --color-bg
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
