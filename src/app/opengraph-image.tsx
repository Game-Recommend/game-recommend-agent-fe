import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/** 1.91:1. 카카오톡·슬랙·X·디스코드가 모두 자르지 않고 그대로 쓰는 공유 카드 크기다. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GAME RECOMMEND — 다음으로 즐길 게임, 나에게 맞게.";

/** 게임패드 실루엣. src/components/ui/BrandMark.tsx와 같은 좌표다. */
const PAD =
  "M7 4.75H17A5 5 0 0 1 22 9.75C22 13.45 21.3 17.05 19.5 18.55C18.2 19.65 16.5 19.25 15.8 17.75" +
  "L14.3 14.85H9.7L8.2 17.75C7.5 19.25 5.8 19.65 4.5 18.55C2.7 17.05 2 13.45 2 9.75A5 5 0 0 1 7 4.75Z";
/** 패드 안의 재생 삼각형. */
const PLAY = "M10.1 6.75 15.2 9.55 10.1 12.35Z";

// 이 파일은 CSS를 거치지 않아 var()를 풀 수 없다. 토큰 값을 그대로 적고 어느 토큰인지만 남긴다.
const BG = "#1a1c1a"; // --color-bg
const LIME = "#baf956"; // --color-primary
const ON_LIME = "#0f110f"; // --color-on-primary
const TEXT = "#ffffff"; // --color-text
const TEXT_SECONDARY = "#c5c8c5"; // --color-text-secondary

/**
 * 본문과 같은 Pretendard로 그린다. Satori는 woff2를 읽지 못하므로 woff 서브셋을 쓴다.
 * 이 경로를 읽는 시점은 빌드 때다(경로에 동적 구간이 없어 이미지가 정적으로 생성된다).
 */
const FONT_DIR = "node_modules/pretendard/dist/web/static/woff-subset";

async function font(weight: "Regular" | "Bold") {
  return readFile(path.join(process.cwd(), FONT_DIR, `Pretendard-${weight}.subset.woff`));
}

/** 링크를 공유했을 때 보이는 썸네일. 로고와 화면 첫 문장을 그대로 담는다. */
export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([font("Regular"), font("Bold")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: BG,
          // 화면 위쪽에 깔린 연두 기운을 카드에도 아주 옅게 남긴다.
          backgroundImage: `radial-gradient(1100px 620px at 12% -20%, rgba(186, 249, 86, 0.16), transparent 70%)`,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 24 24">
            <path d={PAD} fill={LIME} />
            <path d={PLAY} fill={ON_LIME} stroke={ON_LIME} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.16em", color: LIME }}>
            GAME RECOMMEND
          </div>
        </div>
        {/* 쉼표에서 직접 끊는다. 한 덩어리로 두면 줄 끝에서 "맞게"가 갈라진다. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            fontSize: 78,
            fontWeight: 700,
            lineHeight: 1.25,
            color: TEXT,
          }}
        >
          <div>다음으로 즐길 게임,</div>
          <div>나에게 맞게.</div>
        </div>
        <div style={{ marginTop: 32, fontSize: 36, color: TEXT_SECONDARY }}>
          취향과 환경에 맞는 다음 게임을 찾아보세요.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
