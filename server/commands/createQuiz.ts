import { quizzes, sockets } from '../index.ts'
import { Quiz } from '../Quiz.ts'
import { QuizData } from '../types.ts'
import { broadcast } from '../helpers/broadcast.ts'

export const createQuiz = (name: string, data: QuizData, hostUuid: string) => {
  const newQuiz = new Quiz(data, hostUuid, name)
  quizzes.set(name, newQuiz)

  const allUuidsExceptCreator = [...sockets.values()]
  .filter(socket => socket && socket?.id !== hostUuid)
  .map(socket => socket.id)

  broadcast({
    command: 'newQuiz',
  }, allUuidsExceptCreator)

  return true
}