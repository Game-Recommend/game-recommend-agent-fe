"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { DEFAULT_LOCALE, isLocale, STRINGS, type Locale, type Strings } from "@/lib/i18n";

/** 고른 언어를 이 브라우저에 남겨 다음 방문에도 같은 언어로 연다. */
const STORAGE_KEY = "game-recommend:locale";

/*
 * 고른 언어는 React 밖(브라우저 저장소)에 있으므로 외부 저장소로 다룬다.
 * 판정 축은 둘이다. 고른 값(저장소)이 언제나 이기고, 고른 적이 없을 때만 브라우저가 알려주는
 * 선호 언어로 떨어진다. 뒤집을 수 없는 자동 판정은 판정이 아니라 강제라, 자동은 첫 방문의 기본값일 뿐이다.
 * 서버는 둘 다 볼 수 없어 언제나 기본 언어로 그리고, 화면이 붙은 뒤 React가 실제 값으로 한 번 다시
 * 그린다. 그래서 영어로 떨어질 사람은 첫 한 프레임만 한국어를 본다.
 * 저장이 막혀 있어도(사생활 보호 모드 등) 이번 방문 동안은 고른 값이 남도록 메모리에도 들고 있는다.
 */
let currentLocale: Locale | null = null;
const listeners = new Set<() => void>();

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * 고른 적이 없는 사람의 첫 화면 언어. 브라우저가 알려주는 선호 언어를 쓰며 접속 국가는 보지 않는다.
 * 1차 서브태그만 보는 이유는 ko·ko-KR·ko-Kore-KR이 모두 한국어여야 하는데 startsWith("ko")로
 * 자르면 kok(콘칸어)까지 한국어로 끌려오기 때문이다. 지원 언어가 둘뿐이라 한국어가 아니면 영어다.
 * navigator가 없는 자리(SSR·구형 브라우저)는 기본 언어로 떨어진다.
 */
function browserLocale(): Locale {
  const browser = globalThis.navigator?.language;
  if (!browser) return DEFAULT_LOCALE;
  return browser.split("-")[0].toLowerCase() === "ko" ? "ko" : "en";
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // 다른 탭에서 언어를 바꾸면 storage 이벤트로만 알 수 있다. 같은 탭의 바뀜은 notify가 알린다.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    currentLocale = readStoredLocale() ?? browserLocale();
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** 같은 값을 계속 돌려줘야 하므로 한 번 읽은 뒤에는 메모리 값을 쓴다. */
function getSnapshot(): Locale {
  currentLocale ??= readStoredLocale() ?? browserLocale();
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function storeLocale(next: Locale) {
  currentLocale = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 저장이 막혀 있어도 이번 방문에는 바뀐 채로 쓸 수 있게 둔다
  }
  notify();
}

type LocaleValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** 고른 언어의 고정 문구 */
  t: Strings;
};

const LocaleContext = createContext<LocaleValue | null>(null);

/** 화면 전체가 같은 언어를 보게 묶는다. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 화면 언어가 바뀌면 문서 언어도 따라가야 읽어 주는 목소리와 글꼴 처리가 맞는다.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => storeLocale(next), []);
  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, t: STRINGS[locale] }),
    [locale, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (value === null) throw new Error("useLocale은 LocaleProvider 안에서만 쓸 수 있습니다.");
  return value;
}
