/**
 * 백엔드 `POST /recommend` 응답 계약.
 * 원본은 game-recommend-be의 app/schemas/*.py와 app/pipeline/query_processing/conditions.py이며,
 * 필드가 바뀌면 여기도 함께 맞춥니다. 리뷰·미디어처럼 선택 단계가 채우는 값은 모두 null일 수 있습니다.
 */

export type CheckStatus = "met" | "unmet" | "unknown" | "skipped";

export type ConditionCheck = {
  status: CheckStatus;
  reason: string;
};

export type HardwareSpecs = {
  cpu: string | null;
  gpu: string | null;
  ram_gb: number | null;
  os: string | null;
  raw_text: string | null;
};

export type GameConditions = {
  hardware: HardwareSpecs | null;
  genres: string[];
  excluded_genres: string[];
  preferences: string[];
  players: number | null;
  connection: "online" | "local" | null;
  play_mode: "singleplayer" | "cooperative" | "competitive" | null;
  max_price_krw: number | null;
  max_playtime_hours: number | null;
  max_session_minutes: number | null;
  platforms: string[];
  recommendation_count: number;
};

export type GameCandidate = {
  igdb_id: number;
  name: string;
  steam_app_id: number | null;
  platforms: string[];
  source_url: string | null;
  /** IGDB 소개 문구. 대부분 영어입니다. */
  summary: string | null;
  genres: string[];
  themes: string[];
  /** IGDB 전체 완료 시간(시간 단위) */
  playtime_hours: number | null;
};

export type PriceQuote = {
  igdb_id: number;
  /** 백엔드가 통화·단위를 검증한 원화 가격. 0이면 무료입니다. */
  amount_krw: number;
  source_url: string | null;
};

export type PriceResult = {
  igdb_id: number;
  quote: PriceQuote | null;
  check: ConditionCheck;
};

export type RequirementSpec = {
  os: string | null;
  cpu: string | null;
  gpu: string | null;
  ram_gb: number | null;
  raw_text: string;
  source_url: string | null;
};

export type HardwareResult = {
  igdb_id: number;
  /** 최소 사양 (판정 기준) */
  requirement: RequirementSpec | null;
  /** 권장 사양 (표시용) */
  recommended: RequirementSpec | null;
  check: ConditionCheck;
};

export type ReviewSummary = {
  igdb_id: number;
  summary: string;
  source_urls: string[];
};

export type MediaSource = "steamgriddb" | "steam" | "igdb";

/** 추천 카드용 미디어. 없는 항목은 null이며 화면이 텍스트나 빈 영역으로 대체합니다. */
export type GameMedia = {
  igdb_id: number;
  /** 투명 배경 로고(PNG). 목록에서 이름 대신 놓습니다. */
  logo_url: string | null;
  logo_source: MediaSource | null;
  /** 가로 배너. 1920×620 계열이 우선이고 없으면 16:9 아트워크입니다. */
  hero_url: string | null;
  hero_width: number | null;
  hero_height: number | null;
  hero_source: MediaSource | null;
  /** `youtube.com/embed/{id}?autoplay=1&mute=1`로 넣는 YouTube ID */
  trailer_youtube_id: string | null;
  trailer_source: MediaSource | null;
};

export type EvaluatedGame = {
  game: GameCandidate;
  price: PriceResult;
  hardware: HardwareResult;
  review: ReviewSummary | null;
  media: GameMedia | null;
};

export type RecommendationResponse = {
  conditions: GameConditions;
  /** 추천 후보. 검색 순서를 유지하며 recommendation_count개 이하입니다. */
  games: EvaluatedGame[];
  /** 가격·사양 검사에서 제외한 후보. review·media는 항상 null입니다. */
  excluded_games: EvaluatedGame[];
  warnings: string[];
  /** 마크다운 없는 짧은 한국어 요약 문단 */
  answer: string;
};

/* SSE 이벤트. `Accept: text/event-stream`으로 요청했을 때 `stage`가 이어지다 `result` 또는 `error`로 끝납니다. */

export type StageStatus = "started" | "completed" | "failed";

export type StageEvent = {
  event: "stage";
  /** 백엔드 오케스트레이터의 한국어 단계명 */
  stage: string;
  status: StageStatus;
  detail: string | null;
};

export type ResultEvent = { event: "result"; result: RecommendationResponse };

export type ErrorEvent = { event: "error"; detail: string };

export type PipelineEvent = StageEvent | ResultEvent | ErrorEvent;

/**
 * 진행 표시가 고정으로 그리는 파이프라인. 한 칸에 나란히 둔 이름은 백엔드가 병렬로 실행하는 단계라
 * 이벤트 순서가 섞여 옵니다. 백엔드는 가격·하드웨어 뒤에 "조건 판정"도 보내지만,
 * 그 결과가 추천·제외 목록으로 그대로 드러나므로 화면에서는 칸을 두지 않습니다.
 */
export const PIPELINE_FLOW: readonly (readonly string[])[] = [
  ["질문 분해"],
  ["게임 검색"],
  ["가격", "하드웨어"],
  ["리뷰 요약", "미디어"],
  ["최종 답변 생성"],
];
