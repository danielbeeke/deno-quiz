import { quizzes } from '../index.ts'

export const restartQuiz = (room: string, uuid: string) => {
  const quiz = quizzes.get(room)
  if (quiz?.hostUuid !== uuid) throw new Error('Only the host can restart the quiz');
  quiz.restart()
  return true
}