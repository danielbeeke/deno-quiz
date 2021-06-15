import { quizzes } from '../index.ts'

export const nextQuestion = (room: string, uuid: string) => {
  const quiz = quizzes.get(room)
  if (quiz?.hostUuid !== uuid) throw new Error('Only the host can forward the quiz');
  quiz.nextQuestion()
  return true
}