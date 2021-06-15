import { Profile as userProfile, profiles } from '../core/Profile'
import { cyrb53 } from '../helpers/cyrb53'
import { Quiz } from '../types'

class Connection extends EventTarget {

  protected socket: WebSocket
  protected uuid: string = ''

  constructor (server: string) {
    super()

    this.socket = new WebSocket('wss:' + server)
    this.socket.addEventListener('message', (event: MessageEvent) => {
      try {
        const command = JSON.parse(event.data)

        if (command.command === 'error') {
          this.dispatchEvent(new CustomEvent('error', {
            detail: command.message
          }))  
        }

        if (command.command === 'success') {
          this.dispatchEvent(new CustomEvent('success', {
            detail: command.message
          }))  
        }

        if (command.command === 'enteredQuiz' && command.profile.uuid) {
          profiles.set(command.profile.uuid, command.profile)

          if (document.body.dataset.route === 'quiz') {
            document.body.dispatchEvent(new CustomEvent('render'))
          }
        }

        if (['someoneAnswered', 'quizStarted', 'proceed'].includes(command.command) && command.room && document.body.dataset.route === 'quiz') {
          document.body.dispatchEvent(new CustomEvent('render'))
        }

      }
      catch (exception) {
        console.log(exception)    
      }
    })

    this.socket.addEventListener('open', () => {
      this.saveProfile(userProfile.get())
    })
  }

  createQuiz (name: string, data: object) {
    return this.sendCommand('createQuiz', { name, data })
  }

  saveProfile (profile: {}) {
    return this.sendCommand('saveProfile', profile)
  }

  selectAnswer (room: string, question: number, answer: number) {
    return this.sendCommand('selectAnswer', { room, question, answer })
  }

  nextQuestion (room: string) {
    return this.sendCommand('nextQuestion', { room })
  }

  getQuizzes () {
    const result: unknown = this.sendCommand('getQuizzes')
    return <Promise<Array<{ room: string, title: string }>>> result
  }

  enterQuiz (room: string) {
    const result: unknown = this.sendCommand('enterQuiz', { room })
    return <Promise<Quiz | null>> result
  }

  getQuiz (room: string) {
    const result: unknown = this.sendCommand('getQuiz', { room })
    return <Promise<Quiz | null>> result
  }

  startQuiz (room: string) {
    return this.sendCommand('startQuiz', { room })
  }

  sendCommand (command: string, parameters: {} = {}) {
    const hash = cyrb53(JSON.stringify({ command, ...parameters}))

    return new Promise((resolve, reject) => {
      const finishFlow = () => {
        this.handleResponse(resolve, reject, hash)
        this.socket.send(JSON.stringify({
          command: command, ...parameters, uuid: userProfile.uuid, hash
        }))
      }

      if (this.socket.readyState !== 1) {
        const interval = setInterval(() => {
          if (this.socket.readyState === 1) {
            clearInterval(interval)
            finishFlow()
          }
        }, 100)
      }
      else {
        finishFlow()
      }
    })
  }

  handleResponse (resolve: (data: string) => any, reject: (data: string) => any, hash: number) {
    const listener = (event: MessageEvent) => {
      const command = JSON.parse(event.data)

      if (command.hash === hash) {
        if (command.command === 'error') {
          reject(command.message)
        }
        else if (command.command === 'success') {
          resolve(command.message)
        }
        
        this.socket.removeEventListener('message', listener)
      }
    }

    this.socket.addEventListener('message', listener)
  }
}

export const connection = new Connection(`${location.hostname}:4443`)