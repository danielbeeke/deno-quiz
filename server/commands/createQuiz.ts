import { quizzes } from '../index.ts'
import { Quiz } from '../Quiz.ts'
import { QuizData } from '../types.ts'

export const createQuiz = (name: string, data: QuizData, hostUuid: string) => {
  const newQuiz = new Quiz(data, hostUuid, name)
  quizzes.set(name, newQuiz)
  return true
}