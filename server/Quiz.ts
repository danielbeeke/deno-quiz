import { QuizData } from './types.ts'
import { broadcast } from './helpers/broadcast.ts'
import { quizzes } from './index.ts'

export class Quiz {

  public state: string = 'open'
  public data: QuizData
  public hostUuid: string
  public room: string
  public password: string
  public members: Set<string> = new Set()
  public currentQuestion = -1

  constructor (data: QuizData, hostUuid: string, room: string, password: string = '') {
    this.data = data
    this.hostUuid = hostUuid
    this.room = room
    this.password = password
  }

  public addMember (uuid: string) {
    this.members.add(uuid)
  }

  public start () {
    this.state = 'question'
    this.currentQuestion = 0
    broadcast({
      command: 'quizStarted',
      room: this.room,
    }, [...this.members.values()])
  }

  public restart () {
    this.state = 'question'
    this.currentQuestion = 0

    for (const question of Object.values(this.data.questions)) {
      /** @ts-ignore */
      question.answers = {}
    }

    broadcast({
      command: 'quizStarted',
      room: this.room,
    }, [...this.members.values()])
  }

  public stop () {
    quizzes.delete(this.room)

    broadcast({
      command: 'quizStopped',
      room: this.room,
    }, [...this.members.values()])
  }

  public previousQuestion () {
    if (this.data.questions[this.currentQuestion - 1]) {
      this.state = 'question'
      this.currentQuestion--
    }

    broadcast({
      command: 'proceed',
      room: this.room,
    }, [...this.members.values()])
  }

  public nextQuestion () {
    if (this.data.questions[this.currentQuestion + 1]) {
      this.state = 'question'
      this.currentQuestion++
    }
    else {
      this.currentQuestion = -1
      this.data.score = {}

      for (const member of this.members) {
        let score = 0
  
        for (const question of Object.values(this.data.questions)) {
          const correctAnswers = question.choices.filter(choice => choice.correct === true)
          for (const correctAnswer of correctAnswers) {
            const correctIndex = correctAnswer ? question.choices.indexOf(correctAnswer) : null
             if (correctIndex !== null && question.answers?.[member].includes(correctIndex)) score++  
          }
        }
  
        this.data.score[member] = score
      }
  
      this.state = 'done'
    }
    broadcast({
      command: 'proceed',
      room: this.room,
    }, [...this.members.values()])
  }

  public setAnswer (question: number, answer: number, uuid: string) {
    if (!this.data.questions[question]) throw new Error('Missing question')
    if (!this.data.questions[question].answers) this.data.questions[question].answers = {}
    if (!this.data.questions[question].answers[uuid]) this.data.questions[question].answers[uuid] = []
    this.data.questions[question].answers[uuid].push(answer)

    broadcast({
      command: 'someoneAnswered',
      room: this.room,
    }, [...this.members.values()])

  }
  
}
