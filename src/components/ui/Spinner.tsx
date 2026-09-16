import styles from "@/components/ui/Spinner.module.css";
import { cx } from "@/lib/cx";

export type SpinnerSize = "sm" | "md";

const SIZE_CLASS: Record<SpinnerSize, string> = { sm: styles.sm, md: styles.md };

/** 장식용 회전 표시. 스크린 리더에는 숨기므로 진행 상황은 옆의 글자로 알린다. */
export function Spinner({ size = "sm", className }: { size?: SpinnerSize; className?: string }) {
  return <span className={cx(styles.spinner, SIZE_CLASS[size], className)} aria-hidden="true" />;
}
