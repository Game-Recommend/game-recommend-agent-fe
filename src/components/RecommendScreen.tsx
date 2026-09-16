"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { GameCard } from "@/components/GameCard";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import styles from "@/components/RecommendScreen.module.css";
import { StageProgress } from "@/components/StageProgress";
import { TrailerPanel } from "@/components/TrailerPanel";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Panel } from "@/components/ui/Panel";
import { TextArea } from "@/components/ui/TextArea";
import {
  RecommendationError,
  requestRecommendation,
  type RecommendationRequester,
} from "@/lib/recommend-client";
import type { RecommendationResponse, StageEvent } from "@/lib/recommendation";

/** 프록시가 검사하는 질문 길이 상한과 같습니다. */
const MAX_QUESTION_LENGTH = 500;

const EXAMPLE_QUESTIONS = [
  {
    label: "협동 · 3만 원 이하 · RTX 3060",
    question:
      "RTX 3060, RAM 16GB PC를 사용하고 있어. 친구 한 명과 온라인으로 같이 할 수 있고, 공포 게임은 싫어. 3만 원 이하이면서 Steam 평가가 좋은 게임 5개만 추천해줘.",
  },
  {
    label: "2만 원 이하 스토리 RPG",
    question:
      "지금 2만 원 이하로 살 수 있는 게임 중에서 스토리가 중요한 RPG 추천해줘. 턴제 게임은 별로 안 좋아해.",
  },
  {
    label: "4인 온라인 협동",
    question:
      "친구 4명이서 온라인으로 같이 할 게임을 찾고 있어. 경쟁보다는 협동 위주였으면 좋겠고 한 판이 너무 길지 않았으면 좋겠어.",
  },
  {
    label: "15시간 이하 가벼운 싱글",
    question:
      "취업 준비하면서 가볍게 할 게임을 찾고 있어. 한 번에 30분~1시간 정도 하기 좋고, 전체 플레이타임도 15시간을 넘지 않는 싱글 게임이면 좋겠어.",
  },
];

type Phase =
  | { status: "idle" }
  | { status: "loading"; stages: StageEvent[] }
  | { status: "done"; result: RecommendationResponse }
  | { status: "error"; message: string };

/** `?mock=1`로 열면 백엔드 대신 예시 응답을 씁니다. 화면 작업과 데모용입니다. */
async function pickRequester(): Promise<RecommendationRequester> {
  if (new URLSearchParams(window.location.search).has("mock")) {
    const { mockRecommendation } = await import("@/lib/mock-recommendation");
    return mockRecommendation;
  }
  return requestRecommendation;
}

export function RecommendScreen() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (text: string) => {
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
      const result = await request(trimmed, { onStage, signal: controller.signal });
      if (controller.signal.aborted) return;
      setPhase({ status: "done", result });
      setSelectedId(result.games[0]?.game.igdb_id ?? null);
    } catch (error) {
      if (controller.signal.aborted) return; // 취소했거나 새 요청으로 대체된 경우
      setPhase({
        status: "error",
        message:
          error instanceof RecommendationError
            ? error.message
            : "추천 요청 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

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
          <p className={styles.brand}>
            <BrandMark className={styles.brandMark} />
            GAME RECOMMEND
          </p>
          <h1 className={styles.title}>다음으로 즐길 게임, 나에게 맞게.</h1>
          <form className={styles.form} onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="question">
              게임 추천 질문
            </label>
            <TextArea
              id="question"
              className={styles.input}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onKeyDown}
              maxLength={MAX_QUESTION_LENGTH}
              rows={2}
              placeholder="예: 3만 원 이하로 친구와 온라인 협동할 게임 5개 추천해줘"
              autoComplete="off"
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={loading || question.trim() === ""}>
                추천받기
              </Button>
              {loading && (
                <Button variant="secondary" onClick={cancel}>
                  취소
                </Button>
              )}
            </div>
          </form>
          <ul className={styles.examples} aria-label="예시 질문">
            {EXAMPLE_QUESTIONS.map((example) => (
              <li key={example.label}>
                <Chip
                  title={example.question}
                  disabled={loading}
                  onClick={() => {
                    setQuestion(example.question);
                    void submit(example.question);
                  }}
                >
                  {example.label}
                </Chip>
              </li>
            ))}
          </ul>
        </header>

        {phase.status === "loading" && <StageProgress events={phase.stages} />}

        {phase.status === "error" && (
          <Panel as="p" tone="danger" padding="sm" role="alert">
            {phase.message}
          </Panel>
        )}

        {result && (
          <section className={styles.results} aria-label="추천 결과">
            <Panel padding="sm">
              <p className={styles.answerText} role="region" aria-label="추천 요약" tabIndex={0}>
                {result.answer}
              </p>
            </Panel>

            {result.warnings.length > 0 && (
              <Panel tone="warning" padding="sm">
                <ul className={styles.warnings} aria-label="안내">
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
                조건을 모두 충족하는 게임을 찾지 못했어요. 조건을 조금 바꿔서 다시 물어보세요.
              </Panel>
            )}
          </section>
        )}
      </main>
    </>
  );
}
