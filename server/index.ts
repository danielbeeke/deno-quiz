import { serve } from "https://deno.land/std@0.98.0/http/server.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
} from "https://deno.land/std@0.98.0/ws/mod.ts";
import { createQuiz } from './commands/createQuiz.ts'

const commands = { createQuiz }
export const quizzes: Map<string, unknown> = new Map()

async function handleWs(sock: WebSocket) {
  console.log("socket connected!");
  try {
    for await (const ev of sock) {
      if (typeof ev === "string") {
        try {
          const jsonMessage = JSON.parse(ev)
          if (jsonMessage.command === 'createQuiz' && jsonMessage.name && jsonMessage.data) {
            const resultMessage = commands.createQuiz(jsonMessage.name, jsonMessage.data)

            await sock.send(JSON.stringify({
              command: 'success',
              message: resultMessage
            }));
          }
        }
        catch (exception) {
          await sock.send(JSON.stringify({
            command: 'error',
            message: exception.message
          }));
        }
      } else if (ev instanceof Uint8Array) {
        // binary message.
        console.log("ws:Binary", ev);
      } else if (isWebSocketPingEvent(ev)) {
        const [, body] = ev;
        // ping.
        console.log("ws:Ping", body);
      } else if (isWebSocketCloseEvent(ev)) {
        // close.
        const { code, reason } = ev;
        console.log("ws:Close", code, reason);
      }
    }
  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!sock.isClosed) {
      await sock.close(1000).catch(console.error);
    }
  }
}

if (import.meta.main) {
  /** websocket echo server */
  const port = Deno.args[0] || "8080";
  console.log(`websocket server is running on :${port}`);
  for await (const req of serve(`:${port}`)) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    })
      .then(handleWs)
      .catch(async (err) => {
        console.error(`failed to accept websocket: ${err}`);
        await req.respond({ status: 400 });
      });
  }
}