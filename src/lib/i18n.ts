/**
 * 화면에 보이는 고정 문구. 한국어와 영어를 한 곳에 나란히 두어 한쪽만 고치는 일이 없게 한다.
 *
 * 백엔드가 만드는 문장(answer·리뷰 요약·warnings·판정 이유)은 여기 없다. 그건 백엔드가
 * 요청의 출력 언어를 받도록 고쳐야 바뀌므로, 그전까지 영어 화면에서도 한국어로 나온다.
 */

export const LOCALES = ["ko", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/** 토글 버튼에 적는 두 글자. 화면에 보이는 글자는 늘 그 언어 자신의 표기다. */
export const LOCALE_LABELS: Record<Locale, string> = { ko: "KO", en: "EN" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** 원화 표기. 한국어는 쓰던 대로 `22,000원`, 영어는 통화 기호를 붙여 `₩22,000`으로 둔다. */
const KRW_KO = new Intl.NumberFormat("ko-KR");
const KRW_EN = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const ko = {
  /** 언어 토글에서 읽어 주는 이름. 늘 그 언어로 적는다. */
  localeName: "한국어",
  header: {
    title: "다음으로 즐길 게임, 나에게 맞게.",
    questionLabel: "게임 추천 질문",
    placeholder: "예: 3만 원 이하로 친구와 온라인 협동할 게임 5개 추천해줘",
    submit: "추천받기",
    cancel: "취소",
    examplesLabel: "예시 질문",
    languageLabel: "언어",
  },
  progress: {
    title: "추천을 준비하고 있어요. 보통 10~20초 걸려요.",
    status: { pending: "대기", started: "진행 중", completed: "완료", failed: "실패" },
    /** 같은 도구를 여러 번 부른 것을 읽어 주는 말. 뒤에 상태가 이어진다. */
    toolCallCount: (count: number) => `${count}회 호출, `,
    toolCallTotal: (count: number) => `도구 호출 ${count}회`,
  },
  results: {
    sectionLabel: "추천 결과",
    answerLabel: "추천 요약",
    warningsLabel: "안내",
    empty: "조건을 모두 충족하는 게임을 찾지 못했어요. 조건을 조금 바꿔서 다시 물어보세요.",
  },
  card: {
    price: "가격",
    minSpec: "최소 사양",
    recommendedSpec: "권장 사양",
    free: "무료",
    priceUnknown: "가격 확인 불가",
    specUnknown: "요구 사양 정보 없음",
    reviewMissing: "리뷰 요약을 가져오지 못했어요.",
    playtime: (hours: string) => `완료까지 약 ${hours}시간`,
    priceText: (amountKrw: number) => `${KRW_KO.format(amountKrw)}원`,
    check: { met: "충족", unmet: "미충족", unknown: "확인 불가" },
    links: { igdb: "IGDB", store: "스토어", review: "리뷰 출처" },
  },
  trailer: {
    label: "트레일러",
    title: (name: string) => `${name} 트레일러`,
    none: "이 게임은 트레일러가 없어요.",
    idle: "게임을 선택하면 트레일러가 재생돼요.",
  },
  errors: {
    unknown: "추천 요청 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
    streamInterrupted: "추천이 끝나기 전에 연결이 끊겼습니다. 다시 시도해 주세요.",
    requestFailed: (status?: number) =>
      `추천 요청에 실패했습니다.${status === undefined ? "" : ` (${status})`}`,
    invalidPayload: "추천 응답 형식이 올바르지 않습니다.",
    emptyBody: "추천 응답 본문이 비어 있습니다.",
    pipelineFailed: "추천 처리 중 오류가 발생했습니다.",
  },
};

/** ko가 기준이다. en은 같은 모양이어야 하므로 키를 빠뜨리면 타입 검사에서 걸린다. */
export type Strings = typeof ko;

const en: Strings = {
  localeName: "English",
  header: {
    title: "Your next game, matched to you.",
    questionLabel: "Game recommendation question",
    placeholder: "e.g. Recommend 5 online co-op games under ₩30,000",
    submit: "Get recommendations",
    cancel: "Cancel",
    examplesLabel: "Example questions",
    languageLabel: "Language",
  },
  progress: {
    title: "Putting your recommendations together. This usually takes 10–20 seconds.",
    status: { pending: "Waiting", started: "Running", completed: "Done", failed: "Failed" },
    toolCallCount: (count: number) => `called ${count} times, `,
    toolCallTotal: (count: number) => `${count} tool call${count === 1 ? "" : "s"}`,
  },
  results: {
    sectionLabel: "Recommendations",
    answerLabel: "Summary",
    warningsLabel: "Notes",
    empty: "No game met every condition. Try loosening one of them and asking again.",
  },
  card: {
    price: "Price",
    minSpec: "Minimum specs",
    recommendedSpec: "Recommended specs",
    free: "Free",
    priceUnknown: "Price unavailable",
    specUnknown: "No system requirements found",
    reviewMissing: "Couldn't load the review summary.",
    playtime: (hours: string) => `About ${hours}h to finish`,
    priceText: (amountKrw: number) => KRW_EN.format(amountKrw),
    check: { met: "Meets", unmet: "Fails", unknown: "Unverified" },
    links: { igdb: "IGDB", store: "Store", review: "Review source" },
  },
  trailer: {
    label: "Trailer",
    title: (name: string) => `${name} trailer`,
    none: "This game has no trailer.",
    idle: "Pick a game to play its trailer.",
  },
  errors: {
    unknown: "Something went wrong while asking for recommendations. Please try again.",
    streamInterrupted: "The connection dropped before the recommendations finished. Please try again.",
    requestFailed: (status?: number) =>
      `The recommendation request failed.${status === undefined ? "" : ` (${status})`}`,
    invalidPayload: "The recommendation response had an unexpected shape.",
    emptyBody: "The recommendation response was empty.",
    pipelineFailed: "Something went wrong while building the recommendations.",
  },
};

export const STRINGS: Record<Locale, Strings> = { ko, en };

/**
 * 단계 이름은 백엔드가 보내는 한국어 문자열이 그대로 키다(recommendation.ts의 PIPELINE_FLOW).
 * 그래서 키는 건드리지 않고 영어 라벨만 여기 둔다. 모르는 이름은 받은 그대로 보여 준다.
 */
const STAGE_LABELS_EN: Record<string, string> = {
  "질문 분해": "Query parsing",
  "에이전트 추론": "Agent reasoning",
  "조건 판정": "Condition check",
  미디어: "Media",
  "게임 검색": "Game search",
  가격: "Price",
  하드웨어: "Hardware",
  "리뷰 점수": "Review score",
  "리뷰 요약": "Review summary",
};

export function stageLabel(stage: string, locale: Locale): string {
  return locale === "en" ? (STAGE_LABELS_EN[stage] ?? stage) : stage;
}

/**
 * 단계에 붙는 짧은 설명. 백엔드가 한국어로 만들어 보내므로 아는 두 가지 모양만 영어로 바꾼다.
 * 백엔드가 출력 언어를 받게 되면 이 함수는 통째로 지운다.
 */
const CANDIDATE_DETAIL = /^후보 (\d+)개$/;
const JUDGE_DETAIL = /^통과 (\d+)개 중 (\d+)개 추천, 제외 (\d+)개$/;

export function stageDetail(detail: string, locale: Locale): string {
  if (locale !== "en") return detail;
  const candidates = CANDIDATE_DETAIL.exec(detail);
  if (candidates) return `${candidates[1]} candidates`;
  const judged = JUDGE_DETAIL.exec(detail);
  if (judged) return `${judged[2]} of ${judged[1]} passing, ${judged[3]} excluded`;
  return detail;
}

export type ExampleQuestion = {
  /** 칩에 적는 짧은 이름 */
  label: Record<Locale, string>;
  /**
   * 입력창에 넣는 문장. 전송은 언제나 ko를 보낸다. 백엔드의 조건 추출과 평가가 한국어 질문에
   * 맞춰져 있어, 영어 화면에서도 파이프라인에 닿는 문장은 한국어로 고정한다.
   */
  question: Record<Locale, string>;
};

export const EXAMPLE_QUESTIONS: readonly ExampleQuestion[] = [
  {
    label: { ko: "협동 · 3만 원 이하 · RTX 3060", en: "Co-op · under ₩30,000 · RTX 3060" },
    question: {
      ko: "RTX 3060, RAM 16GB PC를 사용하고 있어. 친구 한 명과 온라인으로 같이 할 수 있고, 공포 게임은 싫어. 3만 원 이하이면서 Steam 평가가 좋은 게임 5개만 추천해줘.",
      en: "I have a PC with an RTX 3060 and 16GB of RAM. I want something I can play online with one friend, and I don't like horror games. Recommend 5 games under ₩30,000 with good Steam reviews.",
    },
  },
  {
    label: { ko: "2만 원 이하 스토리 RPG", en: "Story RPG under ₩20,000" },
    question: {
      ko: "지금 2만 원 이하로 살 수 있는 게임 중에서 스토리가 중요한 RPG 추천해줘. 턴제 게임은 별로 안 좋아해.",
      en: "Recommend a story-driven RPG I can buy for under ₩20,000 right now. I'm not a fan of turn-based games.",
    },
  },
  {
    label: { ko: "4인 온라인 협동", en: "4-player online co-op" },
    question: {
      ko: "친구 4명이서 온라인으로 같이 할 게임을 찾고 있어. 경쟁보다는 협동 위주였으면 좋겠고 한 판이 너무 길지 않았으면 좋겠어.",
      en: "I'm looking for a game for four of us to play online together. I'd rather have co-op than competitive, and I don't want a single match to run too long.",
    },
  },
  {
    label: { ko: "15시간 이하 가벼운 싱글", en: "Light single-player under 15h" },
    question: {
      ko: "취업 준비하면서 가볍게 할 게임을 찾고 있어. 한 번에 30분~1시간 정도 하기 좋고, 전체 플레이타임도 15시간을 넘지 않는 싱글 게임이면 좋겠어.",
      en: "I'm job hunting and want something light to play on the side. Ideally a single-player game that works in 30-minute to 1-hour sessions and takes no more than 15 hours to finish.",
    },
  },
];
