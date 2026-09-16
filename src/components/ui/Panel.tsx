import type { ComponentPropsWithoutRef, ElementType } from "react";

import styles from "@/components/ui/Panel.module.css";
import { cx } from "@/lib/cx";

export type PanelTone = "default" | "danger" | "warning";
export type PanelPadding = "none" | "sm" | "md" | "lg";

type PanelOwnProps<T extends ElementType> = {
  /** 렌더할 요소. 기본은 div이며 section·article·p·details 등 뜻에 맞는 요소를 고른다. */
  as?: T;
  tone?: PanelTone;
  padding?: PanelPadding;
  /** 누를 수 있는 면. 호버 시 연두 테두리가 옅게 보인다. */
  interactive?: boolean;
  /** 선택된 면. 연두 테두리와 글로우로 표시한다. */
  selected?: boolean;
  className?: string;
};

export type PanelProps<T extends ElementType = "div"> = PanelOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PanelOwnProps<T>>;

const TONE_CLASS: Record<PanelTone, string | undefined> = {
  default: undefined,
  danger: styles.danger,
  warning: styles.warning,
};
const PADDING_CLASS: Record<PanelPadding, string | undefined> = {
  none: undefined,
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

/** 흐린 배너 위에서도 글이 읽히는 반투명 면. 카드·안내·진행 표시의 바탕이다. */
export function Panel<T extends ElementType = "div">({
  as,
  tone = "default",
  padding = "md",
  interactive = false,
  selected = false,
  className,
  ...props
}: PanelProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cx(
        styles.panel,
        TONE_CLASS[tone],
        PADDING_CLASS[padding],
        interactive && styles.interactive,
        selected && styles.selected,
        className,
      )}
      {...props}
    />
  );
}
