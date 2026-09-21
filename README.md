# game-recommend-agent-fe

**한국어** · [English](README.en.md)

게임 추천 서비스의 프론트엔드입니다. React·Next.js App Router·TypeScript를 사용합니다.
백엔드는 [game-recommend-agent-be](https://github.com/Game-Recommend/game-recommend-agent-be)에서 개발합니다.
LLM이 도구를 골라 부르는 에이전트 방식 백엔드라, 진행 표시가 단계 고정 파이프라인 백엔드와 다릅니다.

현재는 추천 화면(질문 입력 → 진행 표시 → 요약·게임 카드·트레일러)과 백엔드 프록시 API(JSON·SSE)를 구현한 단계입니다.

## 시작하기

Node.js 24와 npm을 사용합니다. 경로는 저장소 루트 기준입니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

개발 서버: <http://localhost:3000>

백엔드 없이 화면만 확인하려면 <http://localhost:3000/?mock=1>로 엽니다.
`src/lib/mock-recommendation.ts`의 예시 응답(백엔드 `tests/integration/examples/recommend_response.json` 사본이며,
로고 주소만 실제로 열리는 Steam CDN으로 바꿨습니다)을 SSE 진행처럼 흘려 보여주므로 진행 표시까지 함께 볼 수 있습니다.

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js 타입 생성 및 TypeScript 검사 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드한 서버 실행 |

## 파일 구성

```text
src/app/
├─ layout.tsx           공통 레이아웃·메타데이터·글꼴
├─ page.tsx             추천 화면 진입점
├─ globals.css          전역 기본 스타일
├─ icon.svg             브라우저 탭 아이콘 (BrandMark와 같은 모양)
├─ opengraph-image.tsx  링크 공유 썸네일 (1200×630 PNG, 빌드 때 생성)
├─ design-system/       디자인 시스템 견본 화면 (/design-system)
└─ api/
   ├─ health/route.ts      GET /api/health (백엔드 /health 프록시)
   └─ recommend/route.ts   POST /api/recommend (백엔드 /recommend 프록시, JSON·SSE)
src/components/
├─ RecommendScreen.tsx        질문 입력·요청 상태·결과 배치 (클라이언트 컴포넌트)
├─ GameCard.tsx               게임 카드: 로고·이름 선택 버튼, 누르면 펼쳐지는 가격·사양·리뷰 요약 패널
├─ TrailerPanel.tsx           선택한 게임의 YouTube 트레일러
├─ HeroBackdrop.tsx           선택한 게임의 배너를 흐린 전체 배경으로 표시
├─ StageProgress.tsx          SSE 단계 진행 표시 (고정 네 칸, 에이전트 도구 다섯 개와 호출 횟수)
├─ RecommendScreen.module.css 화면 배치 스타일
└─ ui/                        공용 컴포넌트 (Button, Chip, Badge, Panel, TextArea, Spinner, BrandMark)
src/styles/
└─ tokens.css                 디자인 토큰 (색·글꼴·간격·모서리·효과)
src/lib/
├─ backend.ts                 백엔드 호출 공통 로직 (주소·키·시간 제한·오류 처리·SSE 통과)
├─ recommendation.ts          백엔드 응답·SSE 이벤트 타입 (계약)
├─ recommend-client.ts        브라우저에서 /api/recommend 호출, SSE·JSON 응답 해석
├─ sse.ts                     fetch 응답 본문의 SSE 해석기
├─ mock-recommendation.ts     ?mock=1용 예시 응답
└─ cx.ts                      조건부 className 합치기
next.config.ts      Next.js 설정
tsconfig.json       TypeScript 설정
eslint.config.mjs   ESLint 설정
.env.example        환경 변수 예시
docs/DESIGN_SYSTEM.md      디자인 시스템 사용 규칙
.github/workflows/ci.yml   PR·main 푸시 검증
```

## 디자인 시스템

메인 컬러는 옅은 검정(`#1a1c1a`) 배경, 흰 글씨, 선명한 연두(`#baf956`) 강조 세 가지입니다.
색·글꼴·간격은 `src/styles/tokens.css`의 토큰으로만 지정하고, 버튼·칩·패널 같은 공용 요소는
`src/components/ui`의 컴포넌트를 씁니다. 화면의 CSS 모듈은 배치만 담당합니다.

토큰 값과 대비, 컴포넌트 상태는 <http://localhost:3000/design-system>에서 볼 수 있습니다.
사용 규칙은 [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)에 정리했습니다.

## 추천 화면

응답 필드와 화면 영역의 대응입니다. 리뷰·미디어는 백엔드의 선택 단계가 채우므로 언제든 `null`일 수 있고,
그때는 오른쪽 열처럼 대체합니다.

| 영역 | 응답 필드 | 값이 없을 때 |
| --- | --- | --- |
| 상단 요약 | `answer` (마크다운 없는 문단). 질문 입력란의 두 배 높이로 고정하고 넘치는 글은 그 안에서 스크롤 | — |
| 왼쪽 게임 목록 | `games[]`. 선택 버튼은 `media.logo_url`과 게임 이름. 누르면 펼쳐지는 상세 패널에 `game.genres`·`themes`·`playtime_hours`, `price.quote.amount_krw`, `hardware.requirement`(최소)·`hardware.recommended`(권장), `review.summary`, 출처 링크(IGDB·스토어·리뷰) | 로고가 없거나 불러오지 못하면 이름 텍스트, 리뷰 없음·가격 없음·최소 사양 없음은 각각 안내 문구, 권장 사양·출처 링크는 없으면 숨김. `games`가 비면 목록·트레일러 대신 안내 문구 |
| 전체 화면 흐린 배경 | 선택한 게임의 `media.hero_url`. `hero_width`·`hero_height`는 이미지의 고유 크기로 넘겨 로드 전에도 비율을 확정 | 단색 배경 |
| 오른쪽 트레일러 | `media.trailer_youtube_id` → `youtube.com/embed/{id}?autoplay=1&mute=1&playsinline=1` | 빈 영역과 안내 문구 |
| 보조 정보 | `warnings`는 요약 아래 목록 | 항목이 없으면 숨김 |

`excluded_games`(가격·사양 검사에서 제외한 후보)는 응답에 그대로 들어 있지만 지금 화면에는 그리지 않습니다.
응답 형식을 검사할 때만 확인합니다.

화면 전체를 한 화면 높이(`100dvh`)에 담습니다. 트레일러가 남는 세로 높이를 16:9로 꽉 채우는 너비(결과 영역의
70% 상한)를 먼저 갖고, 목록은 나머지(42% 상한)를 받아 그 안에서만 스크롤합니다. 두 칸이 모두 상한에 걸려 가로가
남으면 가운데로 모읍니다.

결과가 오면 첫 번째 게임이 자동으로 선택됩니다(상세 패널은 접힌 채). 로고나 이름을 누르면 배경과 트레일러가 그
게임으로 바뀌면서 상세 패널이 펼쳐지고, 펼친 카드를 다시 누르면 상세만 접힙니다. 상세 패널은 한 번에 하나만
열립니다. 카드는 감싸는 면 없이 로고와 제목만 두며, 선택된 게임은 로고를 또렷하게(나머지는 불투명도 70%), 제목을
연두로 표시합니다.
가격·사양 판정(`check.status`)은 상세 패널에 충족·미충족·확인 불가 배지로 표시하고(판정 이유 `check.reason`은 배지의
툴팁), 조건을 걸지 않은 `skipped`는 표시하지 않습니다.
너비 900px 이하에서는 한 열로 쌓이고 트레일러가 목록 위로 올라갑니다. 이때는 한 화면에 담지 않고 페이지가 세로로
늘어나며, 목록 높이는 380px로 고정합니다.

## 백엔드 연동

브라우저는 백엔드를 직접 호출하지 않고 이 앱의 Route Handler만 호출합니다.
서버가 `BACKEND_API_URL`로 요청을 전달하면서 `X-API-Key` 헤더에 `BACKEND_API_KEY`를 실어 보냅니다.
백엔드 주소와 키는 서버 환경 변수에만 있으므로 개발자 도구의 네트워크 탭에 노출되지 않습니다.
브라우저가 보낸 쿠키·헤더는 백엔드로 전달하지 않습니다.

| 브라우저 → FE 서버 | FE 서버 → 백엔드 | 용도 |
| --- | --- | --- |
| `GET /api/health` | `GET /health` | 백엔드 주소 설정·연결 확인 |
| `POST /api/recommend` | `POST /recommend` | 추천 요청 (JSON 또는 SSE) |

백엔드의 키 검사는 `POST /recommend`에만 걸려 있고 `/health`에는 없습니다. 그래서 `/api/health`가 200이어도
`BACKEND_API_KEY`가 맞다는 뜻은 아니며, 키가 없거나 다르면 추천 요청이 502(백엔드 인증 설정)로 실패합니다.

추천 요청 본문은 `{"question": "게임 추천해줘"}`이며, `question`은 공백을 제외하고 1자 이상 500자 이하여야 합니다.
500자는 프록시와 입력란(`maxLength`)이 거는 상한이고, 백엔드 스키마 자체의 상한은 5000자입니다.
백엔드의 응답 본문(`conditions`, `games`, `excluded_games`, `warnings`, `answer`)과 상태 코드는 그대로 전달합니다.
타입은 `src/lib/recommendation.ts`에 있으며 백엔드 `app/schemas/*.py`, `app/pipeline/query_processing/conditions.py`와
맞춰 관리합니다.
`API_KEY`가 비어 있거나 외부 API·LLM 키가 설정되지 않은 백엔드는 추천 요청에 503을 반환합니다.

### SSE 진행 스트림

화면은 `Accept: text/event-stream`으로 `POST /api/recommend`를 호출합니다. 프록시는 같은 헤더로 백엔드를 부르고,
백엔드가 SSE로 응답하면 본문을 버퍼링하지 않고 그대로 흘려보냅니다. 화면은 `stage` 이벤트로 단계 진행을
표시하고, `result` 이벤트의 본문을 그리며, `error` 이벤트의 `detail`을 오류로 보여줍니다.

진행 표시는 `src/lib/recommendation.ts`의 `PIPELINE_FLOW`를 고정으로 그립니다. 질문 분해 → 에이전트 추론 →
조건 판정 → 미디어의 네 칸을 선으로 잇고, 지금 도는 칸만 연두로 밝힙니다. 백엔드가 질문마다 이 순서로 거치는
단계가 이 넷입니다(추천이 0개면 미디어는 건너뜁니다). 에이전트 추론 칸은 LLM이 도구를 고르고 부르는 루프 전체를
감싸므로, 그 안의 도구가 도는 동안 계속 진행 중입니다. 조건 판정은 `started` 없이 `completed`만 오므로 대기에서
곧바로 완료로 넘어갑니다.

에이전트가 부르는 도구(게임 검색, 가격, 하드웨어, 리뷰 점수, 리뷰 요약)는 `AGENT_TOOL_STAGES`에 두고, 에이전트
추론 칸 밑으로 창살을 내려 다섯 개를 모두 매답니다. 가운데 도구가 이름 바로 밑에 오도록 이름 한가운데에
맞추므로, 칸 사이를 넓게(`--stage-link`) 벌려 창살이 패널 왼쪽으로 넘치지 않게 합니다. 너비 900px 이하에서는 칸을
벌릴 여유가 없어 창살을 이름 왼쪽 끝에 걸고 첫 도구 위로 줄기를 내립니다. 칸으로 잇지 않는 것은 호출 여부도
횟수도 질문마다 달라 순서대로 잇는 선이 의미가 없기 때문입니다. 실제로 고른 도구만 연두로 밝히고 지금 도는
도구는 깜빡이므로, 끝까지 옅게 남은 이름은 이번 질문에 에이전트가 그 도구를 고르지 않았다는 뜻이 됩니다. 리뷰
점수는 Steam 평가가 선별 기준일 때만 돕니다.

같은 도구가 두 번 이상 돌면 이름 옆에 `×2` 배지가 붙습니다. 한 번만 부른 도구는 이름이 연두로 밝혀지는 것으로
충분하므로 배지를 달지 않습니다.

LLM이 고르는 호출에는 백엔드가 요청 하나당 도구별 상한을 코드로 겁니다(백엔드 `app/agent/limits.py`). 게임 검색·
가격·하드웨어는 1회, 리뷰 점수·리뷰 요약은 2회입니다(후보에 없는 id를 넘겨 실패하면 고쳐서 다시 부를 수 있게 둔
여유입니다). 상한을 넘긴 호출은 도구 본문이 돌지 않아 `started`가 오지 않으므로 화면에서도 세지 않습니다. 그래서
반복이 생기는 경로는 셋입니다.

- 안전망(가격·하드웨어, 에이전트 추론 칸 안): 추천 후보 중 가격·사양 조회 결과가 없는 게임(조회하지 않았거나
  조회가 실패한 경우)을 백엔드 러너가 직접 부릅니다. 상한과 따로 셉니다.
- 후처리(리뷰 요약, 조건 판정 뒤 미디어와 병렬): 확정 후보 중 리뷰 요약이 없는 게임을 러너가 부릅니다. 역시
  상한과 따로 셉니다.
- LLM의 재호출(리뷰 점수·리뷰 요약만): 상한이 2회인 두 도구는 한 루프 안에서 실패한 호출을 고쳐 다시 부르거나,
  재진입한 에이전트가 한 번 더 부를 수 있습니다. 재진입은 초안이 후검증에서 거부됐을 때(재시도 한 번)와, 빈
  초안인데 통과 후보가 남았거나 추천한 게임 이름이 답변에 없을 때(각각 한 번 되묻기) 일어납니다. 상한은 재진입해도
  이어서 세므로 게임 검색·가격·하드웨어는 LLM이 다시 부를 수 없습니다.

따라서 게임 검색은 많아야 한 번만 돌아 배지가 붙지 않습니다.

에이전트 추론 칸의 `도구 호출 N회`와 `×N` 배지는 모두 화면이 `stage` 이벤트의 `started`를 직접 센 값이라 항상
서로 맞습니다. 백엔드도 에이전트 추론 완료에 총계를 붙여 보내지만 쓰지 않습니다. 그 값은 LLM이 고른 호출만
세기 때문에 러너가 대신 부른 몫이 빠지고, 그대로 쓰면 화면 숫자가 도중에 거꾸로 줄어들며 배지 합과도
어긋납니다. 반대로 상한을 넘겨 거부된 호출은 백엔드 총계에만 들어갑니다. 그래서 도구 가짓수인 5와도 다를 수
있습니다. 리뷰 점수를 고르지 않으면 4회고, 안전망·후처리가 돌거나 재진입한 에이전트가 리뷰 도구를 다시 부르면
5회를 넘습니다.

백엔드가 JSON으로 응답하면(SSE를 지원하지 않는 백엔드, 스트림이 열리기 전의 401·422·503 오류) 프록시와 화면 모두
JSON 경로로 처리합니다. 따라서 SSE가 없는 백엔드와도 그대로 동작하며 진행 표시만 생략됩니다.

브라우저가 취소 버튼을 누르거나 페이지를 떠나면 프록시가 백엔드 호출을 끊고, 백엔드는 진행 중인 파이프라인을 취소합니다.
스트림이 `result`·`error` 없이 끊기면 화면에 "연결이 끊겼습니다" 안내가 나옵니다.

```bash
# JSON
curl -X POST http://localhost:3000/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"question": "게임 추천해줘"}'

# SSE
curl -N -X POST http://localhost:3000/api/recommend \
  -H 'Content-Type: application/json' -H 'Accept: text/event-stream' \
  -d '{"question": "게임 추천해줘"}'
```

### 프록시 오류

프록시가 직접 만드는 오류는 FastAPI와 같은 `{"detail": "..."}` 형태입니다.

| 상태 | 원인 |
| --- | --- |
| 400 | 본문이 JSON이 아니거나 `question`이 규칙에 맞지 않음 |
| 500 | `BACKEND_API_URL` 미설정 |
| 502 | 백엔드 연결 실패, 키 불일치(백엔드가 401·403 응답), JSON도 SSE도 아닌 응답 |
| 504 | 백엔드 응답 시간 초과 (55초. SSE는 스트림이 열릴 때까지, JSON은 본문까지) |

환경 변수에 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 브라우저 번들에 포함됩니다.
IGDB·LLM의 비밀 키는 백엔드에서만 관리합니다.

## Vercel

이 GitHub 저장소를 별도 Vercel 프로젝트로 Import합니다.

- Framework Preset: Next.js
- Root Directory: 저장소 루트 (`.`)
- Production Branch: `main`
- Node.js: 24.x
- Install Command: `npm ci`
- Build Command: `npm run build`
- Environment Variables: `BACKEND_API_URL`, `BACKEND_API_KEY` (Production·Preview 모두 등록, 값을 바꾸면 재배포 필요)

SSE 응답은 스트림이 끝날 때까지 함수가 살아 있어야 하므로 `src/app/api/recommend/route.ts`의 `maxDuration`(현재 60초)이
스트림 전체 길이보다 길어야 합니다. 추천은 백엔드 e2e 평가(100문항, 2026-09-19. 백엔드
`evals/agent_e2e/REPORT.md`)에서 중앙값 11초 안팎, 최대 48초였습니다. 다만 백엔드의 단계별 상한이 30초, 에이전트
루프 한 번의 상한이 120초라 더 길어질 수 있고, 함수가 먼저 끝나면 화면에 "연결이 끊겼습니다" 안내가 나옵니다.
플랜의 함수 시간 상한도 함께 확인하세요.

이 저장소는 Vercel 프로젝트 `game-recommend-agent-fe`에 Git 연동되어 있습니다. PR을 열면 프리뷰 배포가,
`main`에 머지하면 운영 배포가 자동으로 만들어집니다. 백엔드는 Vercel 프로젝트 `game-recommend-agent-be`에
배포되어 있으므로 `BACKEND_API_URL`에 그 주소를 넣습니다. `BACKEND_API_KEY`가 Preview 환경에 없으면 프리뷰 배포의
추천 요청은 502(백엔드 인증 설정)로 실패하므로, 프리뷰에서도 확인하려면 Preview 환경에 같은 키를 등록합니다.
GitHub Actions의 CI 통과를 머지 조건으로 사용하려면 저장소의 브랜치 규칙을 설정합니다.
