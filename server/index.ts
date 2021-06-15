import { serveTLS } from "https://deno.land/std@0.98.0/http/server.ts";
import {
  acceptWebSocket,
  WebSocket,
} from "https://deno.land/std@0.98.0/ws/mod.ts";

import { Quiz } from './Quiz.ts'

import { createQuiz } from './commands/createQuiz.ts'
import { saveProfile } from './commands/saveProfile.ts'
import { getQuizzes } from './commands/getQuizzes.ts'
import { enterQuiz } from './commands/enterQuiz.ts'
import { getQuiz } from './commands/getQuiz.ts'
import { startQuiz } from './commands/startQuiz.ts'
import { selectAnswer } from './commands/selectAnswer.ts'
import { nextQuestion } from './commands/nextQuestion.ts'

export const quizzes: Map<string, Quiz> = new Map()
export const profiles: Map<string, unknown> = new Map()
export const sockets: Set<WebSocket & { id?: string }> = new Set()

async function handleWs(sock: WebSocket & { id?: string }) {
  try {

    sockets.add(sock)

    if (sock.isClosed) return

    for await (const ev of sock) {
      let jsonMessage

      if (typeof ev === "string") {
        try {
          jsonMessage = JSON.parse(ev)

          if (jsonMessage.uuid && !sock.id) {
            sock.id = jsonMessage.uuid
          }

          let resultMessage = null

          if (jsonMessage.command === 'createQuiz' && jsonMessage.name && jsonMessage.data) {
            resultMessage = createQuiz(jsonMessage.name, jsonMessage.data, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'saveProfile' && jsonMessage.name && jsonMessage.avatar && jsonMessage.uuid) {
            resultMessage = saveProfile(jsonMessage.name, jsonMessage.avatar, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'getQuizzes') {
            resultMessage = getQuizzes()
          }

          if (jsonMessage.command === 'enterQuiz' && jsonMessage.room) {
            resultMessage = enterQuiz(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'getQuiz' && jsonMessage.room) {
            resultMessage = getQuiz(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'startQuiz' && jsonMessage.room) {
            resultMessage = startQuiz(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'nextQuestion' && jsonMessage.room) {
            resultMessage = nextQuestion(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'selectAnswer' && jsonMessage.room) {
            resultMessage = selectAnswer(jsonMessage.room, jsonMessage.question, jsonMessage.answer, jsonMessage.uuid)
          }

          if (resultMessage) {
            await sock.send(JSON.stringify({
              command: 'success',
              message: resultMessage,
              hash: jsonMessage?.hash
            }));
          }
          else {
            await sock.send(JSON.stringify({
              command: 'error',
              message: `No response was made for the command: ${jsonMessage.command}`,
              hash: jsonMessage?.hash
            }));
          }
        }
        catch (exception) {
          await sock.send(JSON.stringify({
            command: 'error',
            message: exception.message,
            hash: jsonMessage?.hash
          }));
        }
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
  console.log(`websocket server is running`);

  const options = {
    hostname: "0.0.0.0",
    port: 4443,
    certFile: "/home/daniel/Development/certs/localhost.pem",
    keyFile: "/home/daniel/Development/certs/localhost-key.pem",
  };

  for await (const req of serveTLS(options)) {
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