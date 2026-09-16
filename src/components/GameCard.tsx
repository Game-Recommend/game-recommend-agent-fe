"use client";

import { useState } from "react";

import styles from "@/components/RecommendScreen.module.css";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { cx } from "@/lib/cx";
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
  /** 상세 정보를 펼친 카드인지. 한 번에 하나만 열린다. */
  expanded: boolean;
  onToggle: () => void;
};

/** skipped는 사용자가 그 조건을 걸지 않은 것이라 표시하지 않는다. */
const CHECK_BADGES: Record<CheckStatus, { label: string; tone: BadgeTone } | null> = {
  met: { label: "충족", tone: "success" },
  unmet: { label: "미충족", tone: "danger" },
  unknown: { label: "확인 불가", tone: "neutral" },
  skipped: null,
};

const krw = new Intl.NumberFormat("ko-KR");

/**
 * 추천 게임 하나. 평소에는 감싸는 면 없이 로고(없으면 이름)와 제목만 놓고,
 * 누르면 가격·최소 사양·리뷰 요약 패널이 아래로 펼쳐진다. 누른 게임으로 배경 배너와 트레일러도 바뀐다.
 */
export function GameCard({ evaluated, selected, expanded, onToggle }: Props) {
  const { game, price, hardware, review, media } = evaluated;
  const detailId = `game-detail-${game.igdb_id}`;
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
    <article className={cx(styles.card, selected && styles.cardSelected)}>
      <h2 className={styles.cardHeading}>
        <button
          type="button"
          className={styles.thumb}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={onToggle}
        >
          <Logo media={media} name={game.name} />
          <span className={styles.cardTitle}>{game.name}</span>
        </button>
      </h2>

      <Panel id={detailId} padding="sm" className={styles.cardDetail} hidden={!expanded}>
        {meta.length > 0 && <p className={styles.cardMeta}>{meta.join(" · ")}</p>}

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
      </Panel>
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
  const badge = CHECK_BADGES[check.status];
  if (badge === null) return null;
  return (
    <Badge tone={badge.tone} className={styles.badge} title={check.reason}>
      {badge.label}
    </Badge>
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
