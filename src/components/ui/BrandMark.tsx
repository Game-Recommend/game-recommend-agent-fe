import styles from "@/components/ui/BrandMark.module.css";
import { cx } from "@/lib/cx";

/** 게임패드 실루엣. 24×24 안에서 세로 가운데에 오도록 좌표를 맞췄다. */
const PAD =
  "M7 4.75H17A5 5 0 0 1 22 9.75C22 13.45 21.3 17.05 19.5 18.55C18.2 19.65 16.5 19.25 15.8 17.75" +
  "L14.3 14.85H9.7L8.2 17.75C7.5 19.25 5.8 19.65 4.5 18.55C2.7 17.05 2 13.45 2 9.75A5 5 0 0 1 7 4.75Z";
/** 패드 안의 재생 삼각형. 선을 겹쳐 꼭짓점을 둥글린다. */
const PLAY = "M10.1 6.75 15.2 9.55 10.1 12.35Z";

/**
 * 브랜드 마크. 게임패드(게임) 안에 재생 삼각형(플레이)을 넣은 모양이다.
 * 패드는 currentColor라 감싼 곳의 글자색을 따르고, 삼각형만 연두 위 글씨색으로 고정한다.
 * 뜻은 옆의 글자(GAME RECOMMEND)가 전하므로 스크린 리더에는 숨긴다.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={cx(styles.mark, className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PAD} fill="currentColor" />
      <path
        d={PLAY}
        fill="var(--color-on-primary)"
        stroke="var(--color-on-primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
