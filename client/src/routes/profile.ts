import { html } from 'uhtml'
import { Route } from './Route'
import { t } from '../core/Translate'
import '../CustomElements/avatar-input.ts'
import { goTo } from '../core/goto'

export default class Profile extends Route {
  public name = 'profile'
  public path = '/profile'

  protected profileName: string = ''
  protected avatar: string = ''

  constructor () {
    super()

    const profile = localStorage.profile ? JSON.parse(localStorage.profile) : false

    if (profile) {
      this.profileName = profile.name
      this.avatar = profile.avatar
    }
  }

  template () {

    const setProfileName = ({ target }: { target: HTMLInputElement }) => {
      this.profileName = target.value
    }

    const setAvatar = (event: Event) => {
      this.avatar = (event as CustomEvent).detail
    }

    const saveProfile = (event: Event) => {
      event.preventDefault()

      localStorage.profile = JSON.stringify({
        name: this.profileName,
        avatar: this.avatar
      })

      goTo('home')
    }

    return html`
      <h1>Hi, nice to meet you!</h1>

      <form onsubmit=${saveProfile}>
        
        <label>${t`Your avatar`}</label>
        <avatar-input value=${this.avatar} oncapture=${setAvatar} />

        <label>${t`Your name`}</label>
        <input type="text" .value=${this.profileName} onkeyup=${setProfileName} />

        <button>Save profile</button>

      </form>
    `
  }
}