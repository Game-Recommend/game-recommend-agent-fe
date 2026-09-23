"use client";

import { useLocale } from "@/components/LocaleProvider";
import styles from "@/components/RecommendScreen.module.css";
import { Button } from "@/components/ui/Button";
import { LOCALE_LABELS, LOCALES, STRINGS } from "@/lib/i18n";

/**
 * 화면 오른쪽 위의 언어 토글. 고른 쪽만 테두리를 줘서 지금 언어가 무엇인지 보이게 한다.
 * 버튼 글자는 KO·EN 두 글자뿐이라, 읽어 줄 이름은 그 언어 자신의 표기로 따로 둔다.
 */
export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={styles.localeToggle} role="group" aria-label={t.header.languageLabel}>
      {LOCALES.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === locale ? "secondary" : "ghost"}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          <span aria-hidden="true">{LOCALE_LABELS[option]}</span>
          <span className="visually-hidden" lang={option}>
            {STRINGS[option].localeName}
          </span>
        </Button>
      ))}
    </div>
  );
}
