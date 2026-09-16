"use client";

import { useEffect, useRef, useState } from "react";

import styles from "@/app/design-system/page.module.css";

type Kind = "fill" | "text" | "border";
type Rgba = { r: number; g: number; b: number; a: number };
type Resolved = { hex: string; alpha: number; contrast: number | null };

type Props = {
  name: string;
  note?: string;
  kind?: Kind;
  /** 글씨 토큰을 올려 볼 배경 토큰. 없으면 페이지 배경 위에서 대비를 잰다. */
  on?: string;
};

/**
 * 토큰 견본. 값은 CSS에서 실제로 계산된 색을 읽어 보여주므로 tokens.css를 바꾸면 그대로 따라온다.
 * 글씨 토큰은 배경과의 WCAG 대비도 함께 보여준다.
 */
export function ColorToken({ name, note, kind = "fill", on }: Props) {
  const sampleRef = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    // 글꼴·스타일이 적용된 다음 프레임에 읽는다
    const frame = requestAnimationFrame(() => {
      const sample = sampleRef.current;
      if (sample === null) return;
      const style = getComputedStyle(sample);
      const page = parseColor(getComputedStyle(document.body).backgroundColor);
      const value = parseColor(
        kind === "text" ? style.color : kind === "border" ? style.borderTopColor : style.backgroundColor,
      );
      if (page === null || value === null) return;
      let contrast: number | null = null;
      if (kind === "text") {
        const ground = on ? parseColor(style.backgroundColor) : null;
        const base = ground ? composite(ground, page) : page;
        contrast = contrastRatio(composite(value, base), base);
      }
      setResolved({ hex: toHex(value), alpha: value.a, contrast });
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, on]);

  return (
    <div className={styles.token}>
      {kind === "text" ? (
        <div
          ref={sampleRef}
          className={styles.tokenSampleText}
          style={{ color: `var(${name})`, background: on ? `var(${on})` : undefined }}
        >
          가A
        </div>
      ) : (
        <div
          ref={sampleRef}
          className={kind === "border" ? styles.tokenSampleBorder : styles.tokenSampleFill}
          style={kind === "border" ? { borderColor: `var(${name})` } : { background: `var(${name})` }}
        />
      )}
      <div className={styles.tokenInfo}>
        <code className={styles.tokenName}>{name}</code>
        <span className={styles.tokenValue}>
          {resolved === null ? "…" : resolved.hex}
          {resolved !== null && resolved.alpha < 1 && ` · ${Math.round(resolved.alpha * 100)}%`}
          {resolved?.contrast != null && (
            <span className={styles.contrast} data-level={contrastLevel(resolved.contrast)}>
              {resolved.contrast.toFixed(1)}:1 {contrastLevel(resolved.contrast)}
            </span>
          )}
        </span>
        {note && <span className={styles.tokenNote}>{note}</span>}
      </div>
    </div>
  );
}

/** getComputedStyle이 돌려주는 rgb()·rgba()·color(srgb …) 표기를 0~1 값으로 읽는다. */
function parseColor(value: string): Rgba | null {
  const alpha = (raw: string | undefined) =>
    raw === undefined ? 1 : raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number.parseFloat(raw);
  const legacy = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (legacy) {
    return { r: +legacy[1] / 255, g: +legacy[2] / 255, b: +legacy[3] / 255, a: alpha(legacy[4]) };
  }
  const srgb = value.match(/^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (srgb) return { r: +srgb[1], g: +srgb[2], b: +srgb[3], a: alpha(srgb[4]) };
  return null;
}

/** 브라우저처럼 sRGB 값에서 알파 합성한다. */
function composite(top: Rgba, bottom: Rgba): Rgba {
  const mix = (t: number, b: number) => t * top.a + b * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const channel = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgba, b: Rgba): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function contrastLevel(ratio: number): "AAA" | "AA" | "낮음" {
  return ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "낮음";
}

function toHex({ r, g, b }: Rgba): string {
  const byte = (c: number) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}
