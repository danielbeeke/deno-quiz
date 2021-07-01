import { getQuizzes } from './getQuizzes.ts'

export const getQuiz = (room: string, uuid: string) => {
  const returnQuiz = getQuizzes().find(quiz => quiz.room === room)
  if (!returnQuiz) throw new Error('Quiz not found')
  return returnQuiz
}