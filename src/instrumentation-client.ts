import { initBotId } from "botid/client/core";

/**
 * BotID: 브라우저가 보이지 않는 확인을 풀고, 아래 경로로 가는 요청에 그 결과를 헤더로 붙인다.
 * 서버는 같은 경로의 Route Handler에서 `checkBotId()`로 확인한다(`src/app/api/recommend/route.ts`).
 * 여기에 없는 경로에서 `checkBotId()`를 부르면 헤더가 없어 봇으로 판정되므로 경로를 바꾸면 양쪽을 함께 고친다.
 */
initBotId({
  protect: [{ path: "/api/recommend", method: "POST" }],
});
