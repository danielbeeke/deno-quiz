import { html } from 'uhtml'
import { config } from '../config'
import { t } from '../core/Translate'
import { Route } from './Route'
import { connection } from '../core/connection'
import { Profile as userProfile } from '../core/Profile'

export default class Home extends Route {
  public name = 'home'
  public path = ''

  protected quizName = ''
  protected quizPassword = ''
  protected errorMessage = ''
  protected file: File | null = null

  async template () {
    const quizzes = await connection.getQuizzes() ?? []

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }

      setTimeout(() => {
        document.body.dispatchEvent(new CustomEvent('render'))
      }, 100);
    }

    return html`
      <h1>Welcome to ${config.name}!</h1>

      <a href="/profile" class="profile card">
        <h3 class="name">${userProfile.name}</h3>
      </a>

      <a href="/profile" class="secondary button small">${t`Edit profile`}</a>

      <hr>

        <h2>${t`Current quizzes`}</h2>

        ${quizzes.map(quiz => html`
          <a class="button primary" href=${'/quiz/' + quiz.room}>${quiz.title}</a>
        `)}

        ${quizzes.length === 0 ? html`
        <p>Please wait for your host to create one.</p>
        ` : null}
        <hr>

        <a class="button secondary small" onclick=${toggleFullscreen}>
          <img onload="SVGInject(this)" src="/images/fullscreen.svg">
          ${document.fullscreenElement !== null ? t`Close fullscreen` : t`Make fullscreen`}
        </a>


    `
  }
}