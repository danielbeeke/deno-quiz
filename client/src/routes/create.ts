import { html } from 'uhtml'
import { Route } from './Route'
import { t } from '../core/Translate'
import { goTo } from '../core/goto'
import { connection } from '../core/connection'

export default class Create extends Route {
  public name = 'create'
  public path = '/create'

  protected quizName = ''
  protected quizPassword = ''
  protected errorMessage = ''
  protected file: File | null = null

  async template () {
    const setQuizName = ({ target }: { target: HTMLInputElement }) => {
      this.quizName = target.value
    }

    const setQuizPassword = ({ target }: { target: HTMLInputElement }) => {
      this.quizPassword = target.value
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
        await connection.createQuiz(this.quizName, quizData, this.quizPassword)
        this.errorMessage = ''
        sessionStorage.setItem('quiz-' + this.quizName, this.quizPassword)
        goTo('quiz', { name: this.quizName })
      }
      catch (exception) {
        this.errorMessage = exception
        document.body.dispatchEvent(new CustomEvent('render'))
      }
    }

    return html`
      <form class="create-quiz-form" onsubmit=${createQuiz}>
        <h2>${t`I want to create a quiz`}</h2>

        <label>${t`Quiz name`}</label>
        <input type="text" pattern="[a-zA-Z]{4,10}" onkeyup=${setQuizName} />

        <label>${t`Quiz password`}</label>
        <input onkeyup=${setQuizPassword} />

        <label>${t`Quiz questions`}</label>
        <input type="file" accept=".quiz.json" onchange=${saveQuizFile}>

        <button class="button primary">Create quiz</button>
        ${this.errorMessage ? html`<div class="error-message">${this.errorMessage}</div>` : null}
      </form>
    `
  }
}