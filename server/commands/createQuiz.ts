import { quizzes } from '../index.ts'
import { Quiz } from '../Quiz.ts'

export const createQuiz = (name: string, data: object ) => {
  const newQuiz = new Quiz(data)
  quizzes.set(name, newQuiz)
  return true
}