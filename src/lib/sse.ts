/**
 * SSE(Server-Sent Events) 본문을 이벤트 단위로 읽습니다.
 * 브라우저의 `EventSource`는 GET만 지원해 POST 응답에는 쓸 수 없으므로 fetch 응답 본문을 직접 해석합니다.
 * 주석 줄(`: keep-alive`)과 id·retry 필드는 무시하고, `data:`가 여러 줄이면 줄바꿈으로 잇습니다.
 */

export type SseMessage = {
  /** `event:` 필드. 없으면 "message" */
  event: string;
  data: string;
};

export async function* readSseMessages(body: ReadableStream<Uint8Array>): AsyncGenerator<SseMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let event = "message";
  let data: string[] = [];
  const ready: SseMessage[] = [];

  const consumeLine = (line: string) => {
    if (line === "") {
      // 빈 줄이 이벤트의 끝이다. data가 없는 프레임은 버린다.
      if (data.length > 0) ready.push({ event, data: data.join("\n") });
      event = "message";
      data = [];
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  };

  try {
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      buffer += decoder.decode(chunk.value, { stream: !done });

      // 청크 경계에 걸친 \r\n을 두 줄로 세지 않도록 끝의 \r은 다음 청크와 함께 처리한다.
      const end = !done && buffer.endsWith("\r") ? buffer.length - 1 : buffer.length;
      const lines = buffer.slice(0, end).split(/\r\n|\r|\n/);
      buffer = (lines.pop() ?? "") + buffer.slice(end);
      lines.forEach(consumeLine);

      if (done) {
        // 마지막 줄에 줄바꿈이 없어도 처리하고, 남은 이벤트를 마무리한다.
        if (buffer !== "") consumeLine(buffer);
        consumeLine("");
      }
      for (const message of ready.splice(0)) yield message;
    }
  } finally {
    // 소비자가 result·error에서 먼저 빠져나오면 남은 연결을 닫는다.
    await reader.cancel().catch(() => undefined);
  }
}
