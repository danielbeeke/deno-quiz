import { html } from 'uhtml'
import { config } from '../config'
import { t } from '../core/Translate'
import { Route } from './Route'
import { goTo } from '../core/goto'
import { connection } from '../core/connection'
import { Profile as userProfile } from '../core/Profile'

export default class Home extends Route {
  public name = 'home'
  public path = ''

  protected quizName = ''
  protected errorMessage = ''
  protected file: File | null = null

  async template () {
    const quizzes = await connection.getQuizzes() ?? []

    const setQuizName = ({ target }: { target: HTMLInputElement }) => {
      this.quizName = target.value
    }

    const saveQuizFile = ({ target }: { target: HTMLInputElement }) => {
      if (target?.files?.[0]) this.file = target.files[0]
    }

    const createQuiz = async (event: Event) => {
      event.preventDefault()

      if (!this.file) return
      const quizFileContents = await this.file.text()
      const quizData = JSON.parse(quizFileContents)
      
      try {
        await connection.createQuiz(this.quizName, quizData)
        this.errorMessage = ''
        goTo('quiz', { name: this.quizName })
      }
      catch (exception) {
        this.errorMessage = exception
        document.body.dispatchEvent(new CustomEvent('render'))
      }
    }

    return html`
      <h1>Welcome to ${config.name}!</h1>

      <a href="/profile" class="profile card">
        <img class="avatar" src=${userProfile.avatar} />
        <h3 class="name">${userProfile.name}</h3>
      </a>

      <div class="quizzes-list">
        <h2>${t`Running quizzes list`}</h2>

        ${quizzes.map(quiz => html`
          <a class="quiz-link" href=${'/quiz/' + quiz.room}>${quiz.title}</a>
        `)}

        ${quizzes.length === 0 ? html`
        <p>- <br><br>Nobody has created a quiz yet, create one yourself or wait for your host to create one.</p>
        ` : null}
      </div>

      <div class="create-quiz-form">
        <form onsubmit=${createQuiz}>
          <h2>${t`I want to create a quiz`}</h2>

          <label>${t`Quiz name`}</label>
          <input type="text" pattern="[a-zA-Z]{4,10}" onkeyup=${setQuizName} />

          <label>${t`Quiz questions`}</label>
          <input type="file" accept=".quiz.json" onchange=${saveQuizFile}>

          <button class="button primary">Create quiz</button>
          ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : null}
        </form>
      </div>
    `
  }
}