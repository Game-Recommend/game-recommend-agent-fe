# 디자인 시스템

화면을 만들 때 쓰는 색·글꼴·간격의 기준과 공용 컴포넌트를 정리합니다.
브라우저에서 보는 견본은 개발 서버의 [/design-system](http://localhost:3000/design-system)에 있습니다.

## 1. 원칙

- **메인 컬러는 세 가지입니다.** 옅은 검정(배경), 흰색(글씨), 선명한 연두(강조).
- **연두는 아껴 씁니다.** 면적으로 배경 70 : 글씨 24 : 연두 6 정도를 기준으로 하고, 한 화면에서 연두로 채운
  버튼은 하나만 둡니다. 연두가 흔해지면 무엇이 중요한지 보이지 않습니다.
- **값을 직접 쓰지 않습니다.** 모든 색·글꼴·간격·모서리는 `src/styles/tokens.css`의 토큰으로 지정합니다.
- **모양은 컴포넌트가, 배치는 화면이 정합니다.** 버튼·칩·패널의 생김새는 `src/components/ui`가 갖고,
  화면의 CSS 모듈은 그리드·너비·간격만 더합니다.

## 2. 파일 구성

```text
src/styles/tokens.css          토큰 정의 (원시 팔레트 + 의미 토큰)
src/app/globals.css            전역 기본값 (reset, body, 포커스, 움직임 줄이기)
src/components/ui/             공용 컴포넌트 (Button, Chip, Badge, Panel, TextArea, Spinner, BrandMark)
src/app/design-system/         토큰·컴포넌트 견본 화면 (/design-system, 검색 비노출)
docs/DESIGN_SYSTEM.md          이 문서
```

토큰은 두 층입니다. **원시 토큰**(`--gray-*`, `--lime-*`, `--red-*`, `--amber-*`)은 팔레트 자체이고,
**의미 토큰**(`--color-*`, `--text-*`, `--space-*` …)은 역할입니다. 컴포넌트와 화면은 의미 토큰만 씁니다.
반투명 변형은 `color-mix`로 원시 토큰에서 만들기 때문에, 팔레트 한 줄을 바꾸면 파생 색이 함께 바뀝니다.

## 3. 색상

### 메인 컬러

| 역할 | 토큰 | 값 | 설명 |
| --- | --- | --- | --- |
| 배경 | `--color-bg` | `#1a1c1a` | 순검정보다 한 단계 옅은 검정. oklch 명도 0.225 |
| 글씨 | `--color-text` | `#ffffff` | 본문과 제목 |
| 강조 | `--color-primary` | `#baf956` | 선명한 연두. oklch(0.91 0.20 128) |

회색 계열은 연두와 어울리도록 색상각 145에 채도 0.005를 줘 아주 약간만 초록으로 기울였습니다.

### 자주 쓰는 의미 토큰

| 갈래 | 토큰 | 쓰는 곳 |
| --- | --- | --- |
| 표면 | `--color-surface-glass` | 흐린 배너 위에 올리는 패널·카드 |
| 표면 | `--color-surface-glass-raised` | 선택된 카드 |
| 표면 | `--color-surface-sunken` | 로고 상자처럼 한 단계 꺼진 면 |
| 글씨 | `--color-text-secondary` | 보조 설명, 캡션 |
| 글씨 | `--color-text-muted` | 라벨, 메타 정보, 플레이스홀더 |
| 글씨 | `--color-text-accent` | 링크, 브랜드 표기 같은 짧은 강조 |
| 글씨 | `--color-on-primary` | 연두 위에 올리는 글씨 |
| 선 | `--color-border` / `--color-border-strong` | 패널 / 칩·보조 버튼 |
| 선 | `--color-border-control` | 입력 경계 |
| 강조 | `--color-primary-hover` / `-active` / `-subtle` / `-ring` | 호버 / 누름 / 옅은 배경 / 포커스 링 |
| 상태 | `--color-success-*` `--color-danger-*` `--color-warning-*` | 충족·오류·주의 |

### 연두 사용 규칙

- 연두로 채운 버튼은 **화면당 하나**입니다. 나머지는 `variant="secondary"`나 `"ghost"`를 씁니다.
- 연두 위 글씨는 **반드시 `--color-on-primary`**(검정)입니다. 흰 글씨는 대비 1.3:1이라 읽히지 않습니다.
- 연두 글씨는 링크·브랜드 표기처럼 **짧은 곳**에만 씁니다. 문단은 흰색이나 `--color-text-secondary`로 둡니다.
- 포커스 표시는 연두 테두리입니다. 브라우저 기본 outline을 지우지 마세요.

### 대비 (WCAG)

| 조합 | 대비 | 기준 |
| --- | --- | --- |
| 흰 글씨 / 배경 | 17.1:1 | AAA |
| `--color-text-secondary` / 배경 | 10.2:1 | AAA |
| `--color-text-muted` / 배경 | 6.9:1 | AA |
| 연두 / 배경 | 13.7:1 | AAA |
| `--color-on-primary` / 연두 | 15.1:1 | AAA |
| `--color-text-muted` / 밝은 배너 위 유리 패널 | 4.8:1 | AA (최악의 경우) |
| `--color-border-control` / 배경 | 3.5:1 | UI 경계 기준 3:1 통과 |
| 흰 글씨 / 연두 | 1.3:1 | **쓰지 않음** |

유리 패널(`--color-surface-glass`)의 불투명도 80%는 배너가 아무리 밝아도 보조 글씨가 4.5:1을 넘도록
잡은 값입니다. 낮추지 마세요. `/design-system`의 색상 토큰 표에서 실제 대비를 항상 확인할 수 있습니다.

## 4. 타이포그래피

글꼴은 [Pretendard](https://github.com/orioncactus/pretendard)입니다(`pretendard` 패키지의 동적 서브셋을
`src/app/layout.tsx`에서 불러옵니다). 브라우저는 화면에 실제로 쓰인 글자 구간만 내려받습니다.

역할 토큰은 `font` 단축 속성 값이라 한 줄로 굵기·크기·행간·글꼴이 정해집니다.

```css
.cardTitle {
  font: var(--text-title);
  letter-spacing: var(--tracking-title);
}
```

| 토큰 | 값 | 쓰는 곳 |
| --- | --- | --- |
| `--text-display` | 800 · 28~40px / 1.2 | 페이지 제목 |
| `--text-headline` | 700 · 24px / 1.3 | 섹션 제목 |
| `--text-title` | 700 · 20px / 1.35 | 카드 제목 |
| `--text-subtitle` | 600 · 16px / 1.4 | 소제목 |
| `--text-body-lg` | 400 · 16~18px / 1.8 | 문서 머리말 |
| `--text-body` | 400 · 16px / 1.6 | 기본 본문, 입력, 추천 요약문 |
| `--text-body-sm` | 400 · 14px / 1.6 | 카드 정보 |
| `--text-label` / `--text-label-sm` | 700 · 15px / 13px | 버튼 |
| `--text-caption` | 400 · 13px / 1.5 | 메타, 칩 |
| `--text-overline` | 700 · 13px + 자간 0.16em | 브랜드 표기 |
| `--text-badge` | 700 · 12px | 배지 |
| `--text-code` | 400 · 13px 고정폭 | 코드, 토큰 이름 |

자간은 `--tracking-display`(-0.03em), `--tracking-title`(-0.02em), `--tracking-overline`(0.16em)을 씁니다.
입력 글씨는 16px입니다. 더 작게 하면 iOS Safari가 포커스 때 화면을 확대합니다.

## 5. 간격·모서리·효과

- **간격**: `--space-1`(4px)부터 `--space-16`(64px)까지 4px 단위입니다. 사이 간격은 부모의 `gap`으로 주고
  컴포넌트 바깥에 `margin`을 두지 않습니다.
- **모서리**: `--radius-sm`(8px), `--radius-md`(12px, 버튼·입력·미디어), `--radius-lg`(16px, 패널),
  `--radius-full`(칩·배지·점).
- **효과**: `--shadow-glow`(선택된 카드), `--filter-drop-shadow`(로고 이미지),
  `--blur-sm|md|backdrop`(유리 패널과 배경 흐림).
- **움직임**: `--duration-fast`(120ms, 색 전환), `--duration-base`(200ms, 테두리·그림자),
  `--duration-slow`(800ms, 배경 전환), `--ease-standard`. 움직임 줄이기 설정을 켠 사용자에게는
  `globals.css`가 전역으로 애니메이션과 전환을 끕니다.
- **쌓임 순서**: `--z-backdrop`(0) < `--z-content`(1) < `--z-sticky`(10).
- **중단점**: 600px(sm)과 900px(md)입니다. 미디어 쿼리에는 변수를 쓸 수 없어 숫자로 적습니다.
  600px 이하에서는 `--page-gutter`가 16px로 줄어듭니다.

## 6. 컴포넌트

`src/components/ui`에 있습니다. 모두 해당 HTML 요소의 속성을 그대로 받습니다.

| 컴포넌트 | props | 메모 |
| --- | --- | --- |
| `Button` | `variant`: primary·secondary·ghost, `size`: md·sm | 기본 `type="button"`. 전송 버튼만 `type="submit"` |
| `Chip` | button 속성 | 예시 질문·필터처럼 나란히 두는 작은 버튼 |
| `Badge` | `tone`: success·danger·warning·neutral | 색만으로 뜻을 전하지 않도록 글자를 함께 씁니다 |
| `Panel` | `as`, `tone`: default·danger·warning, `padding`: none·sm·md·lg, `interactive`, `selected` | `as`로 section·article·p·details 등 뜻에 맞는 요소를 고릅니다 |
| `TextArea` | textarea 속성 | 오류는 `aria-invalid="true"`, 라벨은 부르는 쪽에서 연결 |
| `Spinner` | `size`: sm·md | 장식용이라 스크린 리더에 숨깁니다. 옆에 글자를 두세요 |
| `BrandMark` | `className` | 브랜드 마크. 크기는 `em`이라 옆 글자를 따라갑니다. `GAME RECOMMEND` 표기 왼쪽에 두고, 같은 모양을 `src/app/icon.svg`가 탭 아이콘으로 씁니다 |

```tsx
<Panel as="article" interactive selected={selected} className={styles.card} onClick={onSelect}>
  <h2 className={styles.cardTitle}>{game.name}</h2>
  <Badge tone="success">충족</Badge>
</Panel>
```

## 7. 화면 코드를 쓸 때

- **화면 CSS 모듈은 배치만 담당합니다.** `display`, `grid`, `gap`, `width`, `position` 같은 속성만 두고
  색·글꼴·테두리·모서리는 컴포넌트에 맡깁니다.
- **같은 속성을 덮어쓰지 마세요.** 컴포넌트 CSS가 화면 CSS보다 나중에 로드될 수 있어, 클래스 하나짜리
  선택자끼리는 어느 쪽이 이길지 보장되지 않습니다. 꼭 덮어써야 하면 선택자를 둘 이상 겹쳐
  (`.card.cardSelected`) 특이도를 올립니다.
- **새 색이 필요하면** 원시 팔레트에 단계를 더하고 의미 토큰을 만든 뒤 그 토큰을 씁니다. 컴포넌트나 화면에
  hex를 직접 적지 않습니다.
- 토큰을 고치면 `/design-system`에서 값과 대비가 어떻게 바뀌는지 바로 확인하세요.

## 8. 색을 바꾸려면

연두를 다른 톤으로 바꾸려면 `src/styles/tokens.css`의 `--lime-*` 단계만 고치면 됩니다. 버튼·포커스 링·배지·
선택 테두리·글로우가 모두 이 값을 참조합니다. 배경 검정은 `--gray-900`, 글씨 흰색은 `--white`입니다.
명도·채도를 바꿀 때는 `--color-on-primary`(연두 위 글씨)와 본문 글씨의 대비가 각각 4.5:1을 넘는지
`/design-system`에서 확인합니다.
