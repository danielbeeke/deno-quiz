import { quizzes, profiles } from '../index.ts'
import { Quiz } from '../Quiz.ts'

export const getQuizzes = (getProfiles = false) => {
  return [...quizzes.entries()].map(([room, quiz]: [string, Quiz]) => {
    return {
      room,
      ...quiz.data,
      state: quiz.state,
      members: [...quiz.members.values()],
      host: quiz.hostUuid,
      currentQuestion: quiz.currentQuestion,
      profiles: getProfiles ? [...quiz.members.values()].map(uuid => profiles.get(uuid)) : []
    }
  })
}