import styles from "@/components/RecommendScreen.module.css";
import type { GameMedia } from "@/lib/recommendation";

/**
 * 선택한 게임의 가로 배너를 화면 전체에 아주 약하게만 흐리게 깐다.
 * hero_width·hero_height는 img의 고유 크기로 넘겨 이미지가 로드되기 전에도 비율이 정해지게 하고,
 * 배너(1920×620 계열)든 16:9 아트워크든 가운데를 기준으로 화면을 덮도록 자른다.
 * 배너가 없으면 단색 배경만 남는다.
 */
export function HeroBackdrop({ media }: { media: GameMedia | null }) {
  const url = media?.hero_url ?? null;

  return (
    <div className={styles.backdrop} aria-hidden="true">
      {url && media && (
        // eslint-disable-next-line @next/next/no-img-element -- SteamGridDB·Steam CDN·IGDB 등 호스트가 고정되지 않아 next/image를 쓰지 않는다
        <img
          key={url}
          className={styles.backdropImage}
          src={url}
          alt=""
          width={media.hero_width ?? undefined}
          height={media.hero_height ?? undefined}
          decoding="async"
        />
      )}
    </div>
  );
}
