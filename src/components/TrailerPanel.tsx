"use client";

import { useLocale } from "@/components/LocaleProvider";
import styles from "@/components/RecommendScreen.module.css";
import type { EvaluatedGame } from "@/lib/recommendation";

/**
 * 선택한 게임의 YouTube 트레일러. YouTube는 무음일 때만 자동재생하므로 mute=1이 필요하고,
 * 교차 출처 iframe의 자동재생은 allow="autoplay"가 있어야 동작한다. 영상이 없으면 빈 영역으로 둔다.
 */
export function TrailerPanel({ game }: { game: EvaluatedGame | null }) {
  const { t } = useLocale();
  const videoId = game?.media?.trailer_youtube_id ?? null;

  return (
    <aside className={styles.trailer} aria-label={t.trailer.label}>
      {game && videoId ? (
        <iframe
          key={videoId}
          className={styles.trailerFrame}
          src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&playsinline=1`}
          title={t.trailer.title(game.game.name)}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className={styles.trailerEmpty}>{game ? t.trailer.none : t.trailer.idle}</div>
      )}
    </aside>
  );
}
