import { quizzes } from '../index.ts'

export const stopQuiz = (room: string, uuid: string) => {
  const quiz = quizzes.get(room)
  if (quiz?.hostUuid !== uuid) throw new Error('Only the host can stop the quiz');
  quiz.stop()
  return true
}