import { quizzes } from '../index.ts'

export const startQuiz = (room: string, uuid: string) => {
  const quiz = quizzes.get(room)
  if (quiz?.hostUuid !== uuid) throw new Error('Only the host can start the quiz');
  quiz.start()
  return true
}