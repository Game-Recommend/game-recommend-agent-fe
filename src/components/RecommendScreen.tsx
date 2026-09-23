"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { GameCard } from "@/components/GameCard";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { useLocale } from "@/components/LocaleProvider";
import { LocaleToggle } from "@/components/LocaleToggle";
import styles from "@/components/RecommendScreen.module.css";
import { StageProgress } from "@/components/StageProgress";
import { TrailerPanel } from "@/components/TrailerPanel";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Panel } from "@/components/ui/Panel";
import { TextArea } from "@/components/ui/TextArea";
import { EXAMPLE_QUESTIONS, type Strings } from "@/lib/i18n";
import {
  RecommendationError,
  requestRecommendation,
  type RecommendationRequester,
} from "@/lib/recommend-client";
import type { RecommendationResponse, StageEvent } from "@/lib/recommendation";

/** 프록시가 검사하는 질문 길이 상한과 같습니다. */
const MAX_QUESTION_LENGTH = 500;

type Phase =
  | { status: "idle" }
  | { status: "loading"; stages: StageEvent[] }
  | { status: "done"; result: RecommendationResponse }
  /** 문장이 아니라 오류를 그대로 들고 있어야 언어를 바꿨을 때 문구도 따라 바뀐다. */
  | { status: "error"; error: unknown };

/** `?mock=1`로 열면 백엔드 대신 예시 응답을 씁니다. 화면 작업과 데모용입니다. */
async function pickRequester(): Promise<RecommendationRequester> {
  if (new URLSearchParams(window.location.search).has("mock")) {
    const { mockRecommendation } = await import("@/lib/mock-recommendation");
    return mockRecommendation;
  }
  return requestRecommendation;
}

/** 프록시·백엔드가 문장을 돌려줬으면 그대로 보여 주고, 프론트가 만든 오류만 화면 언어로 고른다. */
function errorText(error: unknown, t: Strings): string {
  if (!(error instanceof RecommendationError)) return t.errors.unknown;
  if (error.detail !== null) return error.detail;
  return error.code === "requestFailed" ? t.errors.requestFailed(error.status) : t.errors[error.code];
}

export function RecommendScreen() {
  const { locale, t } = useLocale();
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed === "") return;

      // 새 요청이 시작되면 진행 중인 요청은 끊는다. 프록시가 백엔드 파이프라인도 취소한다.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPhase({ status: "loading", stages: [] });
      setSelectedId(null);
      setExpandedId(null);

      const onStage = (event: StageEvent) => {
        if (controller.signal.aborted) return;
        setPhase((prev) =>
          prev.status === "loading" ? { status: "loading", stages: [...prev.stages, event] } : prev,
        );
      };

      try {
        const request = await pickRequester();
        const result = await request(trimmed, { onStage, signal: controller.signal, language: locale });
        if (controller.signal.aborted) return;
        setPhase({ status: "done", result });
        setSelectedId(result.games[0]?.game.igdb_id ?? null);
      } catch (error) {
        if (controller.signal.aborted) return; // 취소했거나 새 요청으로 대체된 경우
        setPhase({ status: "error", error });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [locale],
  );

  /** 카드를 누르면 배경·트레일러가 그 게임으로 바뀐다. 펼친 카드를 다시 누르면 상세 정보만 접는다. */
  const toggleGame = (igdbId: number) => {
    setSelectedId(igdbId);
    setExpandedId((prev) => (prev === igdbId ? null : igdbId));
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase({ status: "idle" });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(question);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter는 전송, Shift+Enter는 줄바꿈. 한글 조합 중의 Enter는 조합 확정이므로 무시한다.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(question);
    }
  };

  const loading = phase.status === "loading";
  const result = phase.status === "done" ? phase.result : null;
  const selected = result?.games.find((item) => item.game.igdb_id === selectedId) ?? null;

  return (
    <>
      <HeroBackdrop media={selected?.media ?? null} />
      <main className={styles.page}>
        <header className={styles.header}>
          <div className={styles.topRow}>
            <p className={styles.brand}>
              <BrandMark className={styles.brandMark} />
              GAME RECOMMEND
            </p>
            <LocaleToggle />
          </div>
          <h1 className={styles.title}>{t.header.title}</h1>
          <form className={styles.form} onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="question">
              {t.header.questionLabel}
            </label>
            <TextArea
              id="question"
              className={styles.input}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_QUESTION_LENGTH}
              rows={2}
              placeholder={t.header.placeholder}
              autoComplete="off"
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={loading || question.trim() === ""}>
                {t.header.submit}
              </Button>
              {loading && (
                <Button variant="secondary" onClick={cancel}>
                  {t.header.cancel}
                </Button>
              )}
            </div>
          </form>
          <ul className={styles.examples} aria-label={t.header.examplesLabel}>
            {EXAMPLE_QUESTIONS.map((example) => (
              <li key={example.label.ko}>
                <Chip
                  title={example.question[locale]}
                  disabled={loading}
                  onClick={() => {
                    // 입력창에는 보고 있는 언어로 넣고, 파이프라인에는 한국어 문장을 보낸다.
                    setQuestion(example.question[locale]);
                    void submit(example.question.ko);
                  }}
                >
                  {example.label[locale]}
                </Chip>
              </li>
            ))}
          </ul>
        </header>

        {phase.status === "loading" && <StageProgress events={phase.stages} />}

        {phase.status === "error" && (
          <Panel as="p" tone="danger" padding="sm" role="alert">
            {errorText(phase.error, t)}
          </Panel>
        )}

        {result && (
          <section className={styles.results} aria-label={t.results.sectionLabel}>
            <Panel padding="sm">
              <p className={styles.answerText} role="region" aria-label={t.results.answerLabel} tabIndex={0}>
                {result.answer}
              </p>
            </Panel>

            {result.warnings.length > 0 && (
              <Panel tone="warning" padding="sm">
                <ul className={styles.warnings} aria-label={t.results.warningsLabel}>
                  {result.warnings.map((warning, index) => (
                    <li key={`${index}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </Panel>
            )}

            {result.games.length > 0 ? (
              <div className={styles.columns}>
                <div className={styles.listWrap}>
                  <div className={styles.list}>
                    {result.games.map((item) => (
                      <GameCard
                        key={item.game.igdb_id}
                        evaluated={item}
                        selected={item.game.igdb_id === selectedId}
                        expanded={item.game.igdb_id === expandedId}
                        onToggle={() => toggleGame(item.game.igdb_id)}
                      />
                    ))}
                  </div>
                </div>
                <TrailerPanel game={selected} />
              </div>
            ) : (
              <Panel as="p" padding="lg" className={styles.empty}>
                {t.results.empty}
              </Panel>
            )}
          </section>
        )}
      </main>
    </>
  );
}
