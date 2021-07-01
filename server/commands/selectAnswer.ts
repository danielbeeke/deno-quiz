import { quizzes } from '../index.ts'

export const selectAnswer = (room: string, question: number, answer: number, uuid: string) => {
  const quiz = quizzes.get(room)
  if (!quiz) throw new Error('Quiz not found')
  quiz.setAnswer(question, answer, uuid)
  return true
}