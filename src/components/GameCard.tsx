"use client";

import { useState } from "react";

import styles from "@/components/RecommendScreen.module.css";
import type {
  CheckStatus,
  ConditionCheck,
  EvaluatedGame,
  GameMedia,
  PriceResult,
  RequirementSpec,
} from "@/lib/recommendation";

type Props = {
  evaluated: EvaluatedGame;
  selected: boolean;
  onSelect: () => void;
};

/** skipped는 사용자가 그 조건을 걸지 않은 것이라 표시하지 않는다. */
const CHECK_LABELS: Record<CheckStatus, string | null> = {
  met: "충족",
  unmet: "미충족",
  unknown: "확인 불가",
  skipped: null,
};

const krw = new Intl.NumberFormat("ko-KR");

/**
 * 추천 게임 하나. 위의 로고(없으면 이름)가 선택 버튼이고, 본문은 가격·최소 사양·리뷰 요약이다.
 * 선택하면 배경 배너와 트레일러가 이 게임으로 바뀐다.
 */
export function GameCard({ evaluated, selected, onSelect }: Props) {
  const { game, price, hardware, review, media } = evaluated;
  const tags = [...game.genres, ...game.themes];
  const meta = [
    tags.length > 0 ? tags.join(" · ") : null,
    game.playtime_hours !== null ? `완료까지 약 ${formatNumber(game.playtime_hours)}시간` : null,
  ].filter((part): part is string => part !== null);
  const links = [
    game.source_url ? { href: game.source_url, label: "IGDB" } : null,
    price.quote?.source_url ? { href: price.quote.source_url, label: "스토어" } : null,
    review?.source_urls[0] ? { href: review.source_urls[0], label: "리뷰 출처" } : null,
  ].filter((link): link is { href: string; label: string } => link !== null);

  return (
    <article
      className={`${styles.panel} ${styles.card} ${selected ? styles.cardSelected : ""}`}
      onClick={onSelect}
    >
      <button
        type="button"
        className={styles.logoButton}
        aria-pressed={selected}
        aria-label={`${game.name} 선택`}
      >
        <Logo media={media} name={game.name} />
      </button>

      <div className={styles.cardBody}>
        <div>
          <h2 className={styles.cardTitle}>{game.name}</h2>
          {meta.length > 0 && <p className={styles.cardMeta}>{meta.join(" · ")}</p>}
        </div>

        <dl className={styles.facts}>
          <dt>가격</dt>
          <dd>
            {priceText(price)}
            <CheckBadge check={price.check} />
          </dd>
          <dt>최소 사양</dt>
          <dd title={hardware.requirement?.raw_text}>
            {requirementText(hardware.requirement)}
            <CheckBadge check={hardware.check} />
          </dd>
          {hardware.recommended && (
            <>
              <dt>권장 사양</dt>
              <dd title={hardware.recommended.raw_text}>{requirementText(hardware.recommended)}</dd>
            </>
          )}
        </dl>

        <p className={review ? styles.review : `${styles.review} ${styles.reviewMissing}`}>
          {review?.summary ?? "리뷰 요약을 가져오지 못했어요."}
        </p>

        {links.length > 0 && (
          <p className={styles.links}>
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

/** 로고 이미지. 없거나 불러오지 못하면 이름 텍스트로 대체한다. */
function Logo({ media, name }: { media: GameMedia | null; name: string }) {
  const url = media?.logo_url ?? null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url === null || failedUrl === url) return <span className={styles.logoText}>{name}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SteamGridDB·Steam CDN의 투명 PNG를 그대로 쓰며 호스트가 고정되지 않아 next/image를 쓰지 않는다
    <img
      className={styles.logoImage}
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
    />
  );
}

function CheckBadge({ check }: { check: ConditionCheck }) {
  const label = CHECK_LABELS[check.status];
  if (label === null) return null;
  return (
    <span className={styles.badge} data-status={check.status} title={check.reason}>
      {label}
    </span>
  );
}

function priceText(price: PriceResult): string {
  if (price.quote === null) return "가격 확인 불가";
  return price.quote.amount_krw === 0 ? "무료" : `${krw.format(price.quote.amount_krw)}원`;
}

function requirementText(spec: RequirementSpec | null): string {
  if (spec === null) return "요구 사양 정보 없음";
  const parts = [
    spec.os,
    spec.cpu,
    spec.gpu,
    spec.ram_gb !== null ? `RAM ${formatNumber(spec.ram_gb)}GB` : null,
  ].filter((part): part is string => part !== null && part !== "");
  return parts.length > 0 ? parts.join(" · ") : spec.raw_text;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
