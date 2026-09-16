import type { ComponentPropsWithRef } from "react";

import styles from "@/components/ui/Chip.module.css";
import { cx } from "@/lib/cx";

export type ChipProps = ComponentPropsWithRef<"button">;

/** 알약 모양의 작은 버튼. 예시 질문·필터처럼 여러 개를 나란히 둘 때 쓴다. */
export function Chip({ type = "button", className, ...props }: ChipProps) {
  return <button type={type} className={cx(styles.chip, className)} {...props} />;
}
