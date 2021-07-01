import { serve } from "https://deno.land/std@0.97.0/http/server.ts";
import {
  acceptWebSocket,
  WebSocket,
} from "https://deno.land/std@0.97.0/ws/mod.ts";
import { serveFile } from "https://deno.land/std@0.97.0/http/file_server.ts";
import { Quiz } from './Quiz.ts'

import { createQuiz } from './commands/createQuiz.ts'
import { saveProfile } from './commands/saveProfile.ts'
import { getQuizzes } from './commands/getQuizzes.ts'
import { enterQuiz } from './commands/enterQuiz.ts'
import { getQuiz } from './commands/getQuiz.ts'
import { startQuiz } from './commands/startQuiz.ts'
import { selectAnswer } from './commands/selectAnswer.ts'
import { nextQuestion } from './commands/nextQuestion.ts'
import { previousQuestion } from './commands/previousQuestion.ts'
import { restartQuiz } from './commands/restartQuiz.ts'
import { stopQuiz } from './commands/stopQuiz.ts'

export const quizzes: Map<string, Quiz> = new Map()
export const profiles: Map<string, unknown> = new Map()
export const sockets: Set<WebSocket & { id?: string }> = new Set()

async function fileExists(path: string) {
  try {
    const stats = await Deno.lstat(path);
    return stats && stats.isFile;
  } catch(e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}

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
            resultMessage = createQuiz(jsonMessage.name, jsonMessage.data, jsonMessage.password, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'saveProfile' && jsonMessage.name && jsonMessage.uuid) {
            resultMessage = saveProfile(jsonMessage.name, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'getQuizzes') {
            resultMessage = getQuizzes()
          }

          if (jsonMessage.command === 'enterQuiz' && jsonMessage.room) {
            resultMessage = enterQuiz(jsonMessage.room, jsonMessage.password, jsonMessage.uuid)
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

          if (jsonMessage.command === 'previousQuestion' && jsonMessage.room) {
            resultMessage = previousQuestion(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'restartQuiz' && jsonMessage.room) {
            resultMessage = restartQuiz(jsonMessage.room, jsonMessage.uuid)
          }

          if (jsonMessage.command === 'stopQuiz' && jsonMessage.room) {
            resultMessage = stopQuiz(jsonMessage.room, jsonMessage.uuid)
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
  const options = {
    hostname: "0.0.0.0",
    port: 8080
  };

  console.log(`websocket server is running on ${options.port}`);

  for await (const req of serve(options)) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;

    if (req.url === '/socket') {
      acceptWebSocket({
        conn,
        bufReader,
        bufWriter,
        headers,
      })
        .then(handleWs)
        .catch(async (err: Error) => {
          console.error(`failed to accept websocket: ${err}`);
          await req.respond({ status: 400 });
        });
    }
    else {
      let path = `${Deno.cwd()}/client/dist${req.url}`;
      if (!await fileExists(path)) path = `${Deno.cwd()}/client/dist/index.html`;

      const content = await serveFile(req, path);
      req.respond(content);
      continue;
    }
  }
}