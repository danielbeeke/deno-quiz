import { html } from 'uhtml'
import { config } from '../config'
import { t } from '../core/Translate'
import { Route } from './Route'
import { goTo } from '../core/goto'
import { connection } from '../core/connection'

export default class Home extends Route {
  public name = 'home'
  public path = ''

  protected quizName = ''
  protected errorMessage = ''
  protected file: File | null = null

  template () {
    const { name, avatar } = localStorage.profile ? JSON.parse(localStorage.profile) : {}

    const setQuizName = ({ target }: { target: HTMLInputElement }) => {
      this.quizName = target.value
    }

    const gotoQuiz = (event: Event) => {
      event.preventDefault()
      goTo('quiz', { name: this.quizName })
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

      ${name ? html`
        <a href="/profile" class="profile card">
          <h3>${name}</h3>
          <img src=${avatar}>
        </a>
      ` : null}

      <form class="create-quiz-form" onsubmit=${createQuiz}>
        <h2>${t`I want to create a quiz`}</h2>

        <label>${t`Quiz name`}</label>
        <input type="text" pattern="[a-zA-Z]{4,10}" onkeyup=${setQuizName} />

        <label>${t`Quiz questions`}</label>
        <input type="file" accept=".quiz" onchange=${saveQuizFile}>

        <button>Create quiz</button>
        ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : null}
      </form>

      <form class="goto-quiz-form" onsubmit=${gotoQuiz}>
        <h2>${t`I have received a quiz name`}</h2>

        <label>${t`Quiz name`}</label>
        <input type="text" pattern="[a-zA-Z]{4,10}" onkeyup=${setQuizName} />

        <button>Go to quiz</button>
      </form>
    `
  }
}