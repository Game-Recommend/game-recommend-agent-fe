import type { ComponentPropsWithRef } from "react";

import styles from "@/components/ui/Badge.module.css";
import { cx } from "@/lib/cx";

export type BadgeTone = "success" | "danger" | "warning" | "neutral";

export type BadgeProps = ComponentPropsWithRef<"span"> & { tone?: BadgeTone };

const TONE_CLASS: Record<BadgeTone, string> = {
  success: styles.success,
  danger: styles.danger,
  warning: styles.warning,
  neutral: styles.neutral,
};

/** 짧은 상태 표시. 색만으로 뜻을 전하지 않도록 글자(충족·미충족 등)를 함께 쓴다. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return <span className={cx(styles.badge, TONE_CLASS[tone], className)} {...props} />;
}
