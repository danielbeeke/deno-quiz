import { getQuizzes } from './getQuizzes.ts'
import { quizzes } from '../index.ts'
import { profiles } from '../index.ts'
import { broadcast } from '../helpers/broadcast.ts'

export const enterQuiz = (room: string, password: string, uuid: string) => {
  const quiz = quizzes.get(room)
  if (quiz) quiz.addMember(uuid)
  const returnQuiz = getQuizzes(true).find(quiz => quiz.room === room)
  if (!quiz || !returnQuiz) throw new Error('Quiz not found')

  if (quiz.password && quiz.password !== password) throw new Error('Password does not match')
  
  broadcast({
    command: 'enteredQuiz',
    room,
    profile: profiles.get(uuid)
  }, [...quiz.members.values()].filter(memberUuid => memberUuid !== uuid))

  return returnQuiz
}