import type { ComponentPropsWithRef } from "react";

import styles from "@/components/ui/TextArea.module.css";
import { cx } from "@/lib/cx";

export type TextAreaProps = ComponentPropsWithRef<"textarea">;

/**
 * 여러 줄 입력. 글자 크기가 16px이라 iOS Safari가 포커스 때 화면을 확대하지 않는다.
 * 오류 상태는 aria-invalid="true"로 표시한다. 라벨은 호출하는 쪽에서 연결한다.
 */
export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea className={cx(styles.textarea, className)} {...props} />;
}
