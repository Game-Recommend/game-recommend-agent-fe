# game-recommend-agent-fe

[한국어](README.md) · **English**

> **This file is a translation.** [README.md](README.md) (Korean) is the source of truth; where the two
> disagree, the Korean one is right. The service itself is Korean-only: questions are asked and answers
> are rendered in Korean.

The frontend of the game recommendation service, built with React, the Next.js App Router and TypeScript.
The backend is developed in
[game-recommend-agent-be](https://github.com/Game-Recommend/game-recommend-agent-be).
Because that backend is an agent that lets the LLM choose which tools to call, the progress display
differs from one built on a fixed-stage pipeline.

What exists today is the recommendation screen (question input → progress display → summary, game cards
and trailer) plus the backend proxy API (JSON and SSE).

## Getting started

Node.js 24 and npm. Paths are relative to the repository root.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Dev server: <http://localhost:3000>

To look at the UI without a backend, open <http://localhost:3000/?mock=1>.
It replays the example response in `src/lib/mock-recommendation.ts` (a copy of the backend's
`tests/integration/examples/recommend_response.json`, with only the logo URLs swapped for Steam CDN
addresses that actually resolve) as if it were arriving over SSE, so the progress display is included.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Next.js type generation plus the TypeScript check |
| `npm run build` | Production build |
| `npm start` | Run the built server |

## File layout

```text
src/app/
├─ layout.tsx           Shared layout, metadata and fonts
├─ page.tsx             Entry point for the recommendation screen
├─ globals.css          Global base styles
├─ icon.svg             Browser tab icon (same shape as BrandMark)
├─ opengraph-image.tsx  Link preview thumbnail (1200×630 PNG, generated at build)
├─ design-system/       Design system showcase screen (/design-system)
└─ api/
   ├─ health/route.ts      GET /api/health (proxies the backend /health)
   └─ recommend/route.ts   POST /api/recommend (proxies the backend /recommend, JSON and SSE)
src/components/
├─ RecommendScreen.tsx        Question input, request state and result layout (client component)
├─ GameCard.tsx               Game card: logo/name select button that expands a price, spec and review panel
├─ TrailerPanel.tsx           YouTube trailer for the selected game
├─ HeroBackdrop.tsx           Shows the selected game's banner as a blurred full-screen background
├─ StageProgress.tsx          SSE stage progress (four fixed steps, five agent tools and their call counts)
├─ RecommendScreen.module.css Screen layout styles
└─ ui/                        Shared components (Button, Chip, Badge, Panel, TextArea, Spinner, BrandMark)
src/styles/
└─ tokens.css                 Design tokens (color, type, spacing, radius, effects)
src/lib/
├─ backend.ts                 Shared backend call logic (address, key, timeout, error handling, SSE pass-through)
├─ recommendation.ts          Backend response and SSE event types (the contract)
├─ recommend-client.ts        Calls /api/recommend from the browser, parses SSE and JSON responses
├─ sse.ts                     SSE parser for a fetch response body
├─ mock-recommendation.ts     Example response for ?mock=1
└─ cx.ts                      Conditional className joining
next.config.ts      Next.js configuration
tsconfig.json       TypeScript configuration
eslint.config.mjs   ESLint configuration
.env.example        Example environment variables
docs/DESIGN_SYSTEM.md      Design system usage rules (Korean)
.github/workflows/ci.yml   Verification on PRs and pushes to main
```

## Design system

The palette is three colors: a soft black background (`#1a1c1a`), white text and a vivid lime accent
(`#baf956`). Colors, type and spacing are only ever set through the tokens in `src/styles/tokens.css`,
and shared elements such as buttons, chips and panels come from the components in `src/components/ui`.
A screen's CSS module is responsible for layout only.

Token values, contrast and component states can be viewed at
<http://localhost:3000/design-system>. The usage rules are written up in
[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) (Korean).

## Recommendation screen

How response fields map to regions of the screen. Reviews and media are filled in by optional backend
stages, so they can be `null` at any time; the right-hand column says what is shown instead.

| Region | Response field | When the value is missing |
| --- | --- | --- |
| Top summary | `answer` (a paragraph with no markdown). Fixed at twice the height of the question input, with overflow scrolling inside it | — |
| Left game list | `games[]`. The select button uses `media.logo_url` and the game name. Pressing it expands a detail panel with `game.genres`/`themes`/`playtime_hours`, `price.quote.amount_krw`, `hardware.requirement` (minimum) and `hardware.recommended`, `review.summary`, and source links (IGDB, store, reviews) | If the logo is missing or fails to load, the name as text; missing review, price or minimum specs each get a notice; recommended specs and source links are hidden when absent. If `games` is empty, a notice replaces the list and trailer |
| Blurred full-screen background | The selected game's `media.hero_url`. `hero_width`/`hero_height` are passed as the image's intrinsic size so the aspect ratio is fixed before loading | Solid background |
| Right-hand trailer | `media.trailer_youtube_id` → `youtube.com/embed/{id}?autoplay=1&mute=1&playsinline=1` | Empty area with a notice |
| Supplementary info | `warnings` as a list below the summary | Hidden when there are no items |

`excluded_games` (candidates dropped by the price and spec checks) is present in the response but is not
rendered on the current screen. It is only inspected when checking the response shape.

The whole screen fits in one viewport height (`100dvh`). The trailer first takes the width that fills the
remaining vertical space at 16:9 (capped at 70% of the result area), and the list takes what is left
(capped at 42%), scrolling within itself. When both columns hit their caps and horizontal space is left
over, they are centred.

When results arrive, the first game is selected automatically (with its detail panel collapsed). Pressing
a logo or name switches the background and trailer to that game and expands its detail panel; pressing an
already-expanded card collapses just the details. Only one detail panel is open at a time. Cards have no
surrounding surface — only the logo and title — and the selected game shows its logo at full opacity
(others at 70%) with the title in lime.
Price and spec verdicts (`check.status`) appear in the detail panel as met / not met / unknown badges
(the rationale, `check.reason`, is the badge's tooltip); `skipped`, meaning no such condition was stated,
is not displayed.
At 900px wide and below the layout stacks into a single column with the trailer above the list. In that
case the page is no longer confined to one viewport height and grows vertically, and the list height is
fixed at 380px.

## Backend integration

The browser never calls the backend directly — it only calls this app's Route Handlers.
The server forwards the request to `BACKEND_API_URL` with `BACKEND_API_KEY` in the `X-API-Key` header.
The backend address and key exist only in server environment variables, so they never show up in the
browser devtools network tab. Cookies and headers sent by the browser are not forwarded to the backend.

| Browser → FE server | FE server → backend | Purpose |
| --- | --- | --- |
| `GET /api/health` | `GET /health` | Verify the backend address and connectivity |
| `POST /api/recommend` | `POST /recommend` | Recommendation request (JSON or SSE) |

The backend's key check applies only to `POST /recommend`, not to `/health`. So a 200 from `/api/health`
does not mean `BACKEND_API_KEY` is correct; if the key is missing or wrong, the recommendation request
fails with a 502 (backend authentication configuration).

The request body is `{"question": "게임 추천해줘"}` ("recommend me a game"), and `question` must be
between 1 and 500 characters excluding whitespace. The 500-character cap is imposed by the proxy and the
input field (`maxLength`); the backend schema's own cap is 5,000.
The backend's response body (`conditions`, `games`, `excluded_games`, `warnings`, `answer`) and status
code are passed through unchanged. The types live in `src/lib/recommendation.ts` and are kept in sync with
the backend's `app/schemas/*.py` and `app/pipeline/query_processing/conditions.py`.
A backend whose `API_KEY` is empty, or whose external API and LLM keys are unset, returns 503 to
recommendation requests.

### SSE progress stream

The screen calls `POST /api/recommend` with `Accept: text/event-stream`. The proxy calls the backend with
the same header and, when the backend responds with SSE, streams the body through without buffering. The
screen renders stage progress from the `stage` events, draws the body of the `result` event, and shows
the `detail` of an `error` event as an error.

The progress display draws `PIPELINE_FLOW` from `src/lib/recommendation.ts` as a fixed sequence: four
steps — question parsing → agent reasoning → condition verdict → media — joined by lines, with only the
current step lit in lime. Those four are the stages the backend passes through in this order for every
question (media is skipped when there are no recommendations). The agent-reasoning step wraps the entire
loop in which the LLM picks and calls tools, so it stays in progress while the tools inside it run. The
condition verdict arrives as `completed` with no `started`, so it jumps straight from waiting to done.

The tools the agent calls (game search, price, hardware, review score, review summary) live in
`AGENT_TOOL_STAGES` and hang from a bracket dropped below the agent-reasoning step, all five attached to
it. The bracket is centred on the step's label so the middle tool sits directly beneath it, which is why
the steps are spaced widely (`--stage-link`) — otherwise the bracket would overflow the left edge of the
panel. At 900px and below there is no room to spread the steps, so the bracket hangs from the left edge of
the label and the stem drops onto the first tool. The tools are not joined step-by-step because both
whether and how often each is called varies per question, which makes a sequential line meaningless. Only
the tools actually chosen light up in lime and the running one blinks, so a name that stays dimmed to the
end means the agent did not pick that tool for this question. Review score only runs when Steam ratings
are part of the selection criteria.

When the same tool runs twice or more, a `×2` badge appears next to its name. A tool called only once
needs no badge — the name lighting up in lime says enough.

For the calls the LLM chooses, the backend enforces a per-tool limit per request in code (backend
`app/agent/limits.py`): game search, price and hardware once each; review score and review summary twice
(the slack lets a call that failed by passing an id outside the candidate list be corrected and retried).
A call past the limit never runs the tool body, so no `started` arrives and the screen does not count it
either. That leaves three paths that can produce repeats.

- Safety net (price and hardware, inside the agent-reasoning step): for recommended candidates with no
  price or spec result — never looked up, or the lookup failed — the backend runner calls the tool itself.
  Counted separately from the limit.
- Post-processing (review summary, in parallel with media after the condition verdict): the runner
  fetches summaries for confirmed candidates that lack one. Also counted separately from the limit.
- The LLM calling again (review score and review summary only): the two tools with a limit of 2 can
  correct a failed call within one loop, or be called once more by a re-entering agent. Re-entry happens
  when a draft is rejected by post-validation (one retry), and when the draft is empty although passing
  candidates remain or a recommended game's name is missing from the answer (one re-ask each). The limit
  carries over across re-entry, so the LLM cannot call game search, price or hardware again.

Game search therefore runs at most once and never gets a badge.

The `도구 호출 N회` ("N tool calls") figure on the agent-reasoning step and the `×N` badges are both
counted by the screen itself from the `started` of `stage` events, so they always agree. The backend does
attach its own total to the agent-reasoning completion, but the screen ignores it: that value counts only
the calls the LLM chose, leaving out the ones the runner made on its behalf, so using it would make the
on-screen number drop backwards mid-run and disagree with the badge total. Conversely, calls rejected for
exceeding the limit are counted only in the backend's total. The number can therefore differ from 5, the
number of tools: it is 4 when review score is not chosen, and above 5 when the safety net or
post-processing runs, or a re-entering agent calls the review tools again.

When the backend responds with JSON (a backend without SSE support, or a 401/422/503 error raised before
the stream opens), both the proxy and the screen take the JSON path. So it works unchanged against a
backend without SSE — only the progress display is skipped.

If the browser presses cancel or leaves the page, the proxy drops the backend call and the backend
cancels the in-flight pipeline.
If the stream ends without a `result` or `error`, the screen shows a "연결이 끊겼습니다"
("the connection was lost") notice.

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

### Proxy errors

Errors produced by the proxy itself use the same `{"detail": "..."}` shape as FastAPI.

| Status | Cause |
| --- | --- |
| 400 | The body is not JSON, or `question` does not satisfy the rules |
| 500 | `BACKEND_API_URL` is unset |
| 502 | Backend connection failure, key mismatch (backend responded 401 or 403), or a response that is neither JSON nor SSE |
| 504 | Backend response timeout (55 s — until the stream opens for SSE, until the full body for JSON) |

Do not prefix these environment variables with `NEXT_PUBLIC_`; that would include them in the browser
bundle. The IGDB and LLM secrets are managed by the backend only.

## Vercel

Import this GitHub repository as its own Vercel project.

- Framework Preset: Next.js
- Root Directory: repository root (`.`)
- Production Branch: `main`
- Node.js: 24.x
- Install Command: `npm ci`
- Build Command: `npm run build`
- Environment Variables: `BACKEND_API_URL`, `BACKEND_API_KEY` (registered for both Production and Preview; changing a value requires a redeploy)

An SSE response needs the function to stay alive until the stream ends, so `maxDuration` in
`src/app/api/recommend/route.ts` (currently 60 s) has to exceed the full length of the stream.
Recommendations took around 11 s at the median and 48 s at most in the backend's e2e evaluation (100
items, 2026-09-19; backend `evals/agent_e2e/REPORT.md`). That said, the backend's per-stage limit is 30 s
and one agent loop is capped at 120 s, so it can run longer — and if the function ends first, the screen
shows the "connection was lost" notice. Check your plan's function duration limit as well.

This repository is Git-connected to the Vercel project `game-recommend-agent-fe`. Opening a PR produces a
preview deployment, and merging to `main` produces a production deployment. The backend is deployed to the
Vercel project `game-recommend-agent-be`, so put that address in `BACKEND_API_URL`. If `BACKEND_API_KEY`
is missing from the Preview environment, recommendation requests on preview deployments fail with a 502
(backend authentication configuration) — register the same key for Preview to exercise it there.
To require GitHub Actions CI to pass before merging, configure the repository's branch rules.
