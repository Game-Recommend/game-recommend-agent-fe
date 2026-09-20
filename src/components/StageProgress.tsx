import styles from "@/components/RecommendScreen.module.css";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { cx } from "@/lib/cx";
import {
  AGENT_STAGE,
  AGENT_TOOL_STAGES,
  PIPELINE_FLOW,
  type StageEvent,
  type StageStatus,
} from "@/lib/recommendation";

type NodeStatus = StageStatus | "pending";

type Branch = { name: string; detail: string | null; status: NodeStatus; calls?: number };
type Step = { branches: Branch[]; status: NodeStatus };

const STATUS_LABELS: Record<NodeStatus, string> = {
  pending: "대기",
  started: "진행 중",
  completed: "완료",
  failed: "실패",
};

const TOOL_NAMES = new Set(AGENT_TOOL_STAGES);

/**
 * 도구 이름별 호출 수. 도구를 부를 때마다 started가 한 번 오므로 그것만 세며, 같은 도구를 다시
 * 불러도 늘어난다. 마지막 이벤트만 남기는 latest와 달리 이벤트를 전부 훑어야 반복 호출이 잡힌다.
 */
function countToolCalls(events: StageEvent[]): Map<string, number> {
  const calls = new Map<string, number>();
  for (const event of events) {
    if (event.status !== "started" || !TOOL_NAMES.has(event.stage)) continue;
    calls.set(event.stage, (calls.get(event.stage) ?? 0) + 1);
  }
  return calls;
}

/** 칸 하나의 대표 상태. 갈래가 둘일 때 한쪽만 끝났으면 아직 진행 중으로 본다. */
function stepStatus(statuses: NodeStatus[]): NodeStatus {
  if (statuses.includes("failed")) return "failed";
  if (statuses.every((status) => status === "completed")) return "completed";
  if (statuses.some((status) => status !== "pending")) return "started";
  return "pending";
}

/** 칸을 잇는 선 모양. 다음 칸이 두 갈래면 벌어지고, 두 갈래에서 한 갈래로 가면 모인다. */
function linkClass(from: number, to: number): string {
  if (to > 1) return styles.linkFork;
  if (from > 1) return styles.linkMerge;
  return styles.linkLine;
}

/** 선은 다음 칸이 아직 시작 전이면 지나온 길만 남기고, 앞 칸이 도는 중이라면 아직 밝히지 않는다. */
function linkStatus(from: NodeStatus, to: NodeStatus): NodeStatus {
  if (to !== "pending") return to;
  return from === "completed" ? "completed" : "pending";
}

function BranchText({ name, detail, status, calls = 0 }: Branch) {
  return (
    <>
      {/* 배지를 이름과 같은 흐름에 두어야 좁은 도구 칸에서 이름 옆에 붙었다가 자연스레 줄을 넘긴다 */}
      <span>
        {name}
        {calls > 1 && (
          <Badge className={styles.toolCalls} aria-hidden="true">
            ×{calls}
          </Badge>
        )}
      </span>
      {detail && <span className={styles.stageDetail}>{detail}</span>}
      <span className="visually-hidden">
        {calls > 1 && `${calls}회 호출, `}
        {STATUS_LABELS[status]}
      </span>
    </>
  );
}

/**
 * SSE 진행 표시. 백엔드가 어떤 순서로 이벤트를 보내든 PIPELINE_FLOW의 네 칸을 고정으로 그리고,
 * 지금 도는 칸만 연두로 밝힌다. 에이전트 추론 칸 밑으로는 창살을 내려 고를 수 있는 도구 다섯 개를
 * 매달고, 실제로 고른 것만 밝히며 지금 도는 도구는 깜빡인다. 끝까지 옅게 남은 도구는 이번 질문에
 * 고르지 않았다는 뜻이다. 이벤트가 하나도 없으면(JSON으로 응답하는 백엔드) 안내 문구만 보인다.
 */
export function StageProgress({ events }: { events: StageEvent[] }) {
  const latest = new Map<string, StageEvent>();
  for (const event of events) latest.set(event.stage, event);

  const steps: Step[] = PIPELINE_FLOW.map((names) => {
    const branches = names.map((name): Branch => {
      const event = latest.get(name);
      return { name, detail: event?.detail ?? null, status: event?.status ?? "pending" };
    });
    return { branches, status: stepStatus(branches.map((branch) => branch.status)) };
  });

  const calls = countToolCalls(events);
  const tools: Branch[] = AGENT_TOOL_STAGES.map((name) => {
    const event = latest.get(name);
    return {
      name,
      detail: event?.detail ?? null,
      status: event?.status ?? "pending",
      calls: calls.get(name) ?? 0,
    };
  });

  // 백엔드도 에이전트 추론 완료에 총계를 붙여 보내지만 쓰지 않는다. 그 값은 LLM이 고른 호출만 세어
  // 러너가 대신 부른 몫(가격·사양 안전망, 리뷰 요약 후처리)이 빠지므로, 화면 숫자가 도중에 거꾸로
  // 줄고 배지 합과도 어긋난다. 창살에 매단 도구가 실제로 몇 번 돌았는지를 배지와 같은 출처로 센다.
  const totalCalls = [...calls.values()].reduce((sum, count) => sum + count, 0);
  const agentDetail = totalCalls > 0 ? `도구 호출 ${totalCalls}회` : null;

  return (
    <Panel as="section" aria-live="polite" aria-busy="true">
      <p className={styles.progressTitle}>
        <Spinner />
        추천을 준비하고 있어요. 보통 10~20초 걸려요.
      </p>
      {events.length > 0 && (
        <div className={styles.pipelineScroll}>
          <ol className={styles.pipeline}>
            {steps.map((step, index) => {
              const previous = steps[index - 1];
              return (
                <li key={step.branches[0].name} className={styles.step}>
                  {previous && (
                    <span
                      className={cx(styles.link, linkClass(previous.branches.length, step.branches.length))}
                      data-status={linkStatus(previous.status, step.status)}
                      aria-hidden="true"
                    />
                  )}
                  {step.branches[0].name === AGENT_STAGE ? (
                    // 창살은 이름에만 기준을 건다. detail이 붙어 칸이 넓어져도 가운데가 밀리지 않는다
                    <div className={styles.stage} data-status={step.branches[0].status}>
                      <div className={styles.agentName}>
                        {step.branches[0].name}
                        <ul className={styles.tools}>
                          {tools.map((tool) => (
                            <li
                              key={tool.name}
                              className={cx(styles.stage, styles.tool)}
                              data-status={tool.status}
                            >
                              <BranchText {...tool} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      {agentDetail && <span className={styles.stageDetail}>{agentDetail}</span>}
                      <span className="visually-hidden">{STATUS_LABELS[step.branches[0].status]}</span>
                    </div>
                  ) : step.branches.length === 1 ? (
                    <span className={styles.stage} data-status={step.branches[0].status}>
                      <BranchText {...step.branches[0]} />
                    </span>
                  ) : (
                    <ol className={styles.branches}>
                      {step.branches.map((branch) => (
                        <li key={branch.name} className={styles.stage} data-status={branch.status}>
                          <BranchText {...branch} />
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Panel>
  );
}
