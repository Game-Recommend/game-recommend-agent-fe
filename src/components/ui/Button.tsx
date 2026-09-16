import type { ComponentPropsWithRef } from "react";

import styles from "@/components/ui/Button.module.css";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** primary(연두)는 화면의 핵심 행동 하나에만 쓴다. */
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
};
const SIZE_CLASS: Record<ButtonSize, string> = { sm: styles.sm, md: styles.md };

/** 기본 type은 button이다. 폼 전송 버튼만 type="submit"을 넘긴다. */
export function Button({ variant = "primary", size = "md", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...props}
    />
  );
}
