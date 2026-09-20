import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { ColorToken } from "@/app/design-system/ColorToken";
import styles from "@/app/design-system/page.module.css";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Panel } from "@/components/ui/Panel";
import { Spinner } from "@/components/ui/Spinner";
import { TextArea } from "@/components/ui/TextArea";

export const metadata: Metadata = {
  title: "디자인 시스템 · Game Recommend",
  description: "Game Recommend 화면의 색상·타이포그래피·간격 토큰과 공용 컴포넌트 견본",
  robots: { index: false, follow: false },
};

type TokenSpec = { name: string; note: string; kind?: "fill" | "text" | "border"; on?: string };

const BRAND_COLORS = [
  { name: "옅은 검정", role: "배경. 화면의 대부분을 차지한다", token: "--color-bg" },
  { name: "흰색", role: "글씨. 본문과 제목", token: "--color-text" },
  { name: "선명한 연두", role: "강조. 핵심 행동·선택·포커스에만", token: "--color-primary" },
];

const RATIO = [
  { label: "옅은 검정", percent: 70, token: "--color-bg" },
  { label: "흰색", percent: 24, token: "--color-text" },
  { label: "연두", percent: 6, token: "--color-primary" },
];

const COLOR_GROUPS: { title: string; kind: "fill" | "text" | "border"; tokens: TokenSpec[] }[] = [
  {
    title: "배경·표면",
    kind: "fill",
    tokens: [
      { name: "--color-bg", note: "페이지 배경" },
      { name: "--color-surface", note: "불투명한 면" },
      { name: "--color-surface-raised", note: "한 단계 올라온 면" },
      { name: "--color-surface-glass", note: "흐린 배너 위 패널" },
      { name: "--color-surface-glass-raised", note: "선택된 패널" },
      { name: "--color-surface-sunken", note: "꺼진 면 (트레일러 빈 영역)" },
    ],
  },
  {
    title: "글씨",
    kind: "text",
    tokens: [
      { name: "--color-text", note: "본문·제목" },
      { name: "--color-text-secondary", note: "보조 설명" },
      { name: "--color-text-muted", note: "라벨·메타·플레이스홀더" },
      { name: "--color-text-disabled", note: "비활성 (대비 기준 예외)" },
      { name: "--color-text-accent", note: "링크·짧은 강조" },
      { name: "--color-on-primary", note: "연두 위 글씨", on: "--color-primary" },
    ],
  },
  {
    title: "선",
    kind: "border",
    tokens: [
      { name: "--color-border", note: "패널·구분선" },
      { name: "--color-border-strong", note: "칩·보조 버튼" },
      { name: "--color-border-control", note: "입력 경계 (배경 대비 3:1 이상)" },
      { name: "--color-border-accent", note: "선택 가능한 면의 호버" },
    ],
  },
  {
    title: "강조",
    kind: "fill",
    tokens: [
      { name: "--color-primary", note: "핵심 버튼·포커스·선택" },
      { name: "--color-primary-hover", note: "호버" },
      { name: "--color-primary-active", note: "누름" },
      { name: "--color-primary-subtle", note: "옅은 강조 배경" },
      { name: "--color-primary-ring", note: "포커스 링·글로우" },
    ],
  },
  {
    title: "상태",
    kind: "fill",
    tokens: [
      { name: "--color-success-text", note: "충족·완료", kind: "text" },
      { name: "--color-success-subtle", note: "충족 배지 배경" },
      { name: "--color-danger-text", note: "오류·미충족", kind: "text" },
      { name: "--color-danger-subtle", note: "오류 배지 배경" },
      { name: "--color-warning-text", note: "주의 안내", kind: "text" },
      { name: "--color-warning-subtle", note: "주의 배지 배경" },
    ],
  },
];

const PALETTES = [
  {
    title: "Gray",
    tokens: ["--gray-950", "--gray-900", "--gray-850", "--gray-800", "--gray-750", "--gray-700", "--gray-600", "--gray-500", "--gray-400", "--gray-300", "--gray-200", "--gray-100", "--white"],
  },
  { title: "Lime", tokens: ["--lime-200", "--lime-300", "--lime-400", "--lime-500", "--lime-600", "--lime-700", "--lime-800", "--lime-900"] },
  { title: "Status", tokens: ["--red-300", "--red-500", "--amber-300", "--amber-500"] },
];

const TYPE_ROLES = [
  { token: "--text-display", spec: "800 · 28–40px / 1.2 · 자간 -0.03em", tracking: "--tracking-display", sample: "다음으로 즐길 게임, 나에게 맞게." },
  { token: "--text-headline", spec: "700 · 24px / 1.3", sample: "추천 결과" },
  { token: "--text-title", spec: "700 · 20px / 1.35 · 자간 -0.02em", tracking: "--tracking-title", sample: "Stardew Valley" },
  { token: "--text-subtitle", spec: "600 · 16px / 1.4", sample: "가격과 최소 사양" },
  { token: "--text-body-lg", spec: "400 · 16–18px / 1.8", sample: "친구와 온라인으로 함께할 수 있고 3만 원 이하인 협동 게임 세 개를 골랐어요." },
  { token: "--text-body", spec: "400 · 16px / 1.6", sample: "농장을 가꾸며 마을 사람들과 천천히 친해지는 게임이에요. 한 번에 30분씩 즐기기 좋아요." },
  { token: "--text-body-sm", spec: "400 · 14px / 1.6", sample: "Windows 10 · Intel Core i5-4590 · GTX 970 · RAM 8GB" },
  { token: "--text-label", spec: "700 · 15px / 1.2", sample: "추천받기" },
  { token: "--text-label-sm", spec: "700 · 13px / 1.2", sample: "더 보기" },
  { token: "--text-caption", spec: "400 · 13px / 1.5", sample: "시뮬레이션 · 롤플레잉 · 완료까지 약 53시간" },
  { token: "--text-overline", spec: "700 · 13px / 1.2 · 자간 0.16em", tracking: "--tracking-overline", sample: "GAME RECOMMEND" },
  { token: "--text-badge", spec: "700 · 12px / 1.5", sample: "충족" },
];

const SPACES = [
  ["--space-0-5", "2px"],
  ["--space-1", "4px"],
  ["--space-1-5", "6px"],
  ["--space-2", "8px"],
  ["--space-3", "12px"],
  ["--space-4", "16px"],
  ["--space-5", "20px"],
  ["--space-6", "24px"],
  ["--space-8", "32px"],
  ["--space-10", "40px"],
  ["--space-12", "48px"],
  ["--space-16", "64px"],
];

const RADII = [
  ["--radius-sm", "8px", "작은 요소"],
  ["--radius-md", "12px", "버튼·입력·미디어"],
  ["--radius-lg", "16px", "패널·카드"],
  ["--radius-full", "999px", "칩·배지"],
];

const SECTIONS = [
  ["brand", "메인 컬러"],
  ["colors", "색상 토큰"],
  ["typography", "타이포그래피"],
  ["layout", "간격·모서리"],
  ["components", "컴포넌트"],
  ["rules", "사용 규칙"],
];

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.overline}>
          <BrandMark />
          GAME RECOMMEND · DESIGN SYSTEM
        </p>
        <h1 className={styles.title}>디자인 시스템</h1>
        <p className={styles.lead}>
          옅은 검정 바탕에 흰 글씨를 쓰고, 강조는 선명한 연두 한 가지로 합니다. 화면 코드는{" "}
          <code>src/styles/tokens.css</code>의 토큰과 <code>src/components/ui</code>의 컴포넌트만 씁니다.
        </p>
        <nav className={styles.nav} aria-label="섹션">
          {SECTIONS.map(([id, label]) => (
            <a key={id} className={styles.navLink} href={`#${id}`}>
              {label}
            </a>
          ))}
          <Link className={styles.navLink} href="/">
            추천 화면으로 →
          </Link>
        </nav>
      </header>

      <section id="brand" className={styles.section} aria-labelledby="brand-title">
        <SectionHeader id="brand-title" title="메인 컬러" lead="세 가지 색이 화면 전체의 인상을 정합니다. 연두는 적게 쓸수록 눈에 띕니다." />
        <div className={styles.brandGrid}>
          {BRAND_COLORS.map((color) => (
            <Panel key={color.token} padding="none" className={styles.brandCard}>
              <div className={styles.brandSwatch} style={{ background: `var(${color.token})` }} />
              <div className={styles.brandBody}>
                <p className={styles.brandName}>{color.name}</p>
                <p className={styles.brandRole}>{color.role}</p>
                <ColorToken name={color.token} kind="fill" />
              </div>
            </Panel>
          ))}
        </div>
        <figure className={styles.ratio}>
          <div className={styles.ratioBar} aria-hidden="true">
            {RATIO.map((part) => (
              <span key={part.token} style={{ flexBasis: `${part.percent}%`, background: `var(${part.token})` }} />
            ))}
          </div>
          <figcaption className={styles.ratioLegend}>
            <span className={styles.ratioTitle}>권장 면적 비율</span>
            {RATIO.map((part) => (
              <span key={part.token} className={styles.ratioItem}>
                <span className={styles.ratioDot} style={{ background: `var(${part.token})` }} />
                {part.label} {part.percent}%
              </span>
            ))}
          </figcaption>
        </figure>
      </section>

      <section id="colors" className={styles.section} aria-labelledby="colors-title">
        <SectionHeader id="colors-title" title="색상 토큰" lead="컴포넌트는 역할 이름의 토큰을 씁니다. 값은 브라우저가 계산한 실제 색이고, 글씨는 배경과의 WCAG 대비를 함께 표시합니다." />
        {COLOR_GROUPS.map((group) => (
          <Panel key={group.title} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.tokenGrid}>
              {group.tokens.map((token) => (
                <ColorToken key={token.name} name={token.name} note={token.note} kind={token.kind ?? group.kind} on={token.on} />
              ))}
            </div>
          </Panel>
        ))}
        <Panel className={styles.group}>
          <h3 className={styles.groupTitle}>원시 팔레트</h3>
          <p className={styles.groupLead}>의미 토큰이 참조하는 값입니다. 컴포넌트에서 직접 쓰지 않습니다.</p>
          {PALETTES.map((palette) => (
            <div key={palette.title} className={styles.palette}>
              <p className={styles.paletteTitle}>{palette.title}</p>
              <div className={styles.paletteGrid}>
                {palette.tokens.map((token) => (
                  <ColorToken key={token} name={token} />
                ))}
              </div>
            </div>
          ))}
        </Panel>
      </section>

      <section id="typography" className={styles.section} aria-labelledby="typography-title">
        <SectionHeader id="typography-title" title="타이포그래피" lead="Pretendard를 씁니다. 역할 토큰은 font 단축 속성 값이라 한 줄(font: var(--text-body))로 굵기·크기·행간·글꼴이 함께 정해집니다." />
        <Panel padding="none">
          <ul className={styles.typeList}>
            {TYPE_ROLES.map((role) => (
              <li key={role.token} className={styles.typeRow}>
                <div className={styles.typeMeta}>
                  <code className={styles.tokenName}>{role.token}</code>
                  <span className={styles.tokenValue}>{role.spec}</span>
                </div>
                <p
                  className={styles.typeSample}
                  style={{ font: `var(${role.token})`, letterSpacing: role.tracking ? `var(${role.tracking})` : undefined }}
                >
                  {role.sample}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section id="layout" className={styles.section} aria-labelledby="layout-title">
        <SectionHeader id="layout-title" title="간격·모서리" lead="간격은 4px 단위입니다. 요소 사이 간격은 부모의 gap으로 주고, 컴포넌트 바깥에 margin을 두지 않습니다." />
        <div className={styles.layoutGrid}>
          <Panel>
            <h3 className={styles.groupTitle}>간격</h3>
            <ul className={styles.spaceList}>
              {SPACES.map(([token, px]) => (
                <li key={token} className={styles.spaceRow}>
                  <code className={styles.tokenName}>{token}</code>
                  <span className={styles.tokenValue}>{px}</span>
                  <span className={styles.spaceBar} style={{ width: `var(${token})` }} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h3 className={styles.groupTitle}>모서리</h3>
            <div className={styles.radiusGrid}>
              {RADII.map(([token, px, note]) => (
                <div key={token} className={styles.radiusItem}>
                  <div className={styles.radiusBox} style={{ borderRadius: `var(${token})` }} />
                  <code className={styles.tokenName}>{token}</code>
                  <span className={styles.tokenValue}>
                    {px} · {note}
                  </span>
                </div>
              ))}
            </div>
            <h3 className={styles.groupTitle}>표면</h3>
            <div className={styles.effectStage}>
              <Panel padding="sm" className={styles.effectCard}>
                <strong>유리 패널</strong>
                <span className={styles.tokenValue}>--color-surface-glass</span>
              </Panel>
              <Panel padding="sm" selected className={styles.effectCard}>
                <strong>선택된 패널</strong>
                <span className={styles.tokenValue}>--shadow-glow</span>
              </Panel>
            </div>
          </Panel>
        </div>
      </section>

      <section id="components" className={styles.section} aria-labelledby="components-title">
        <SectionHeader id="components-title" title="컴포넌트" lead="src/components/ui에 있습니다. 모양은 컴포넌트가 정하고, 화면 CSS는 배치(너비·그리드·간격)만 더합니다." />
        <div className={styles.componentGrid}>
          <ComponentBlock name="Button" usage='variant="primary | secondary | ghost" · size="md | sm"'>
            <div className={styles.row}>
              <Button>추천받기</Button>
              <Button variant="secondary">취소</Button>
              <Button variant="ghost">닫기</Button>
            </div>
            <div className={styles.row}>
              <Button size="sm">추천받기</Button>
              <Button size="sm" variant="secondary">
                취소
              </Button>
              <Button size="sm" variant="ghost">
                닫기
              </Button>
            </div>
            <div className={styles.row}>
              <Button disabled>비활성</Button>
              <Button variant="secondary" disabled>
                비활성
              </Button>
            </div>
          </ComponentBlock>

          <ComponentBlock name="Chip" usage="예시 질문·필터처럼 나란히 두는 작은 버튼">
            <div className={styles.row}>
              <Chip>협동 · 3만 원 이하</Chip>
              <Chip>2만 원 이하 스토리 RPG</Chip>
              <Chip disabled>비활성</Chip>
            </div>
          </ComponentBlock>

          <ComponentBlock name="Badge" usage='tone="success | danger | warning | neutral"'>
            <div className={styles.row}>
              <Badge tone="success">충족</Badge>
              <Badge tone="danger">미충족</Badge>
              <Badge tone="warning">주의</Badge>
              <Badge tone="neutral">확인 불가</Badge>
            </div>
          </ComponentBlock>

          <ComponentBlock name="Spinner" usage='size="sm | md" · 장식용이라 옆에 글자를 둔다'>
            <div className={styles.row}>
              <Spinner />
              <Spinner size="md" />
              <span className={styles.inline}>
                <Spinner /> 추천을 준비하고 있어요.
              </span>
            </div>
          </ComponentBlock>

          <ComponentBlock name="TextArea" usage='오류는 aria-invalid="true", 라벨은 호출하는 쪽에서 연결' wide>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>기본</span>
                <TextArea rows={2} placeholder="예: 3만 원 이하로 친구와 온라인 협동할 게임 3개 추천해줘" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>오류</span>
                <TextArea rows={2} aria-invalid="true" defaultValue="게임" />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>비활성</span>
                <TextArea rows={2} disabled defaultValue="요청을 처리하는 중이에요" />
              </label>
            </div>
          </ComponentBlock>

          <ComponentBlock name="Panel" usage='as="section | article | p …" · tone · padding · interactive · selected' wide>
            <div className={styles.panelGrid}>
              <Panel padding="sm">기본</Panel>
              <Panel padding="sm" interactive>
                interactive (호버)
              </Panel>
              <Panel padding="sm" interactive selected>
                selected
              </Panel>
              <Panel padding="sm" tone="danger">
                tone=&quot;danger&quot;
              </Panel>
              <Panel padding="sm" tone="warning">
                tone=&quot;warning&quot;
              </Panel>
            </div>
          </ComponentBlock>
        </div>
      </section>

      <section id="rules" className={styles.section} aria-labelledby="rules-title">
        <SectionHeader id="rules-title" title="사용 규칙" lead="연두가 흔해지면 강조가 사라집니다. 아래 네 가지만 지키면 화면이 같은 톤을 유지합니다." />
        <div className={styles.rules}>
          <Rule
            title="연두 버튼은 화면에 하나"
            doExample={
              <div className={styles.row}>
                <Button size="sm">추천받기</Button>
                <Button size="sm" variant="secondary">
                  취소
                </Button>
              </div>
            }
            dontExample={
              <div className={styles.row}>
                <Button size="sm">추천받기</Button>
                <Button size="sm">취소</Button>
                <Button size="sm">닫기</Button>
              </div>
            }
          />
          <Rule
            title="연두 위 글씨는 검정"
            doExample={<span className={styles.swatchPill} style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}>15.1:1 추천받기</span>}
            dontExample={<span className={styles.swatchPill} style={{ background: "var(--color-primary)", color: "var(--color-text)" }}>1.3:1 추천받기</span>}
          />
          <Rule
            title="긴 글은 흰색, 연두는 짧게"
            doExample={<p className={styles.ruleText}>협동 위주이고 한 판이 짧은 게임을 골랐어요. <a className={styles.ruleLink} href="#rules">리뷰 출처</a></p>}
            dontExample={<p className={styles.ruleText} style={{ color: "var(--color-primary)" }}>협동 위주이고 한 판이 짧은 게임을 골랐어요. 긴 문장을 연두로 쓰면 눈이 쉽게 피로해요.</p>}
          />
          <Rule
            title="값은 토큰으로"
            doExample={<code className={styles.ruleCode}>color: var(--color-text-muted);</code>}
            dontExample={<code className={styles.ruleCode}>color: #a3a5a3;</code>}
          />
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      <p className={styles.sectionLead}>{lead}</p>
    </div>
  );
}

function ComponentBlock({ name, usage, wide = false, children }: { name: string; usage: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <Panel className={styles.componentBlock} style={wide ? ({ gridColumn: "1 / -1" } satisfies CSSProperties) : undefined}>
      <div className={styles.componentHeader}>
        <h3 className={styles.groupTitle}>{name}</h3>
        <code className={styles.tokenValue}>{usage}</code>
      </div>
      {children}
    </Panel>
  );
}

function Rule({ title, doExample, dontExample }: { title: string; doExample: React.ReactNode; dontExample: React.ReactNode }) {
  return (
    <Panel className={styles.rule}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <div className={styles.ruleCases}>
        <div className={styles.ruleCase}>
          <Badge tone="success">이렇게</Badge>
          <div className={styles.ruleExample}>{doExample}</div>
        </div>
        <div className={styles.ruleCase}>
          <Badge tone="danger">이렇게 하지 않기</Badge>
          <div className={styles.ruleExample}>{dontExample}</div>
        </div>
      </div>
    </Panel>
  );
}
