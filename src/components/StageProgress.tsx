import styles from "@/components/RecommendScreen.module.css";
import { PIPELINE_STAGES, type StageEvent, type StageStatus } from "@/lib/recommendation";

const STATUS_LABELS: Record<StageStatus | "pending", string> = {
  pending: "대기",
  started: "진행 중",
  completed: "완료",
  failed: "실패",
};

/**
 * SSE 진행 표시. 알려진 단계를 정해진 순서로 먼저 두고 처음 보는 단계는 뒤에 붙인다.
 * 이벤트가 하나도 없으면(JSON으로 응답하는 백엔드) 단계 목록 없이 안내 문구만 보인다.
 */
export function StageProgress({ events }: { events: StageEvent[] }) {
  const latest = new Map<string, StageEvent>();
  for (const event of events) latest.set(event.stage, event);
  const order = [...PIPELINE_STAGES, ...[...latest.keys()].filter((name) => !PIPELINE_STAGES.includes(name))];

  return (
    <section className={`${styles.panel} ${styles.progress}`} aria-live="polite" aria-busy="true">
      <p className={styles.progressTitle}>
        <span className={styles.spinner} aria-hidden="true" />
        추천을 준비하고 있어요. 보통 20초 안팎 걸려요.
      </p>
      {events.length > 0 && (
        <ol className={styles.stages}>
          {order.map((name) => {
            const event = latest.get(name);
            const status = event?.status ?? "pending";
            return (
              <li key={name} className={styles.stage} data-status={status}>
                <span className={styles.stageIcon} aria-hidden="true" />
                <span>{name}</span>
                {event?.detail && <span className={styles.stageDetail}>{event.detail}</span>}
                <span className="visually-hidden">{STATUS_LABELS[status]}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
