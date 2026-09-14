# game-recommend-fe

게임 추천 서비스의 프론트엔드입니다. React·Next.js App Router·TypeScript를 사용합니다.
백엔드는 [game-recommend-be](https://github.com/Game-Recommend/game-recommend-be)에서 개발합니다.

현재는 시작 화면, 개발·빌드·검증 환경, 백엔드 프록시 API를 구성한 단계입니다. 추천 화면은 아직 구현하지 않았습니다.

## 시작하기

Node.js 24와 npm을 사용합니다. 경로는 저장소 루트 기준입니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

개발 서버: <http://localhost:3000>

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
├─ layout.tsx        공통 레이아웃·메타데이터
├─ page.tsx          시작 화면
├─ globals.css       전역 스타일
└─ api/
   ├─ health/route.ts      GET /api/health (백엔드 /health 프록시)
   └─ recommend/route.ts   POST /api/recommend (백엔드 /recommend 프록시)
src/lib/backend.ts  백엔드 호출 공통 로직 (주소·키·시간 제한·오류 처리)
next.config.ts      Next.js 설정
tsconfig.json       TypeScript 설정
eslint.config.mjs   ESLint 설정
.env.example        환경 변수 예시
.github/workflows/ci.yml   PR·main 푸시 검증
```

## 백엔드 연동

브라우저는 백엔드를 직접 호출하지 않고 이 앱의 Route Handler만 호출합니다.
서버가 `BACKEND_API_URL`로 요청을 전달하면서 `X-API-Key` 헤더에 `BACKEND_API_KEY`를 실어 보냅니다.
백엔드 주소와 키는 서버 환경 변수에만 있으므로 개발자 도구의 네트워크 탭에 노출되지 않습니다.
브라우저가 보낸 쿠키·헤더는 백엔드로 전달하지 않습니다.

| 브라우저 → FE 서버 | FE 서버 → 백엔드 | 용도 |
| --- | --- | --- |
| `GET /api/health` | `GET /health` | 백엔드 연결·키 설정 확인 |
| `POST /api/recommend` | `POST /recommend` | 추천 요청 |

추천 요청 본문은 `{"question": "게임 추천해줘"}`이며, `question`은 공백을 제외하고 1자 이상 500자 이하여야 합니다.
백엔드의 응답 본문(`conditions`, `games`, `excluded_games`, `warnings`, `answer`)과 상태 코드는 그대로 전달합니다.
외부 API·LLM이 연결되지 않은 백엔드는 추천 요청에 503을 반환합니다.

프록시가 직접 만드는 오류는 FastAPI와 같은 `{"detail": "..."}` 형태입니다.

| 상태 | 원인 |
| --- | --- |
| 400 | 본문이 JSON이 아니거나 `question`이 규칙에 맞지 않음 |
| 500 | `BACKEND_API_URL` 미설정 |
| 502 | 백엔드 연결 실패, 키 불일치(백엔드가 401·403 응답), JSON이 아닌 응답 |
| 504 | 백엔드 응답 시간 초과 (55초) |

```bash
curl -X POST http://localhost:3000/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"question": "게임 추천해줘"}'
```

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

현재 이 저장소에 대한 Vercel 프로젝트 연결은 설정하지 않았습니다.
Git 연동을 연결하면 팀원은 커밋·푸시만으로 프리뷰/운영 배포를 사용할 수 있습니다.
GitHub Actions의 CI 통과를 머지 조건으로 사용하려면 저장소의 브랜치 규칙을 설정합니다.
