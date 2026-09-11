# game-recommend-fe

게임 추천 서비스의 프론트엔드입니다. React·Next.js App Router·TypeScript를 사용합니다.
백엔드는 [game-recommend-be](https://github.com/Game-Recommend/game-recommend-be)에서 개발합니다.

현재는 시작 화면과 개발·빌드·검증 환경을 구성한 단계입니다. 추천 화면과 API 호출은 아직 구현하지 않았습니다.

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
└─ globals.css      전역 스타일
next.config.ts      Next.js 설정
tsconfig.json       TypeScript 설정
eslint.config.mjs   ESLint 설정
.env.example        환경 변수 예시
.github/workflows/ci.yml   PR·main 푸시 검증
```

## 백엔드 연동

- 로컬 서버: `http://127.0.0.1:8000`
- 상태 확인: `GET /health`
- 추천 요청: `POST /recommend`, JSON 본문 `{"question": "게임 추천해줘"}`
- 응답: `conditions`, `games`, `excluded_games`, `warnings`, `answer`
- 외부 API·LLM이 연결되지 않은 백엔드는 추천 요청에 503을 반환합니다.

`BACKEND_API_URL`은 서버 측 API 연동을 위한 예시 환경 변수입니다. 현재 코드에서는 사용하지 않습니다.
연동 구현 시 Next.js 서버 경유 또는 브라우저 직접 호출 중 방식을 정합니다.
브라우저에서 직접 호출하면 BE에 FE 도메인에 대한 CORS 설정이 필요합니다.
IGDB·LLM의 비밀 키는 BE에서만 관리합니다.

## Vercel

이 GitHub 저장소를 별도 Vercel 프로젝트로 Import합니다.

- Framework Preset: Next.js
- Root Directory: 저장소 루트 (`.`)
- Production Branch: `main`
- Node.js: 24.x
- Install Command: `npm ci`
- Build Command: `npm run build`

현재 이 저장소에 대한 Vercel 프로젝트 연결은 설정하지 않았습니다.
Git 연동을 연결하면 팀원은 커밋·푸시만으로 프리뷰/운영 배포를 사용할 수 있습니다.
GitHub Actions의 CI 통과를 머지 조건으로 사용하려면 저장소의 브랜치 규칙을 설정합니다.
