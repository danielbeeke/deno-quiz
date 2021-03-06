import { html } from 'uhtml'
import { Route } from './Route'
import { t } from '../core/Translate'
import { goTo } from '../core/goto'
import { Profile as userProfile } from '../core/Profile'

export default class Profile extends Route {
  public name = 'profile'
  public path = '/profile'

  async template () {

    const setProfileName = ({ target }: { target: HTMLInputElement }) => {
      userProfile.name = target.value
    }

    const saveProfile = (event: Event) => {
      event.preventDefault()
      userProfile.save()
      goTo('home')
    }

    return html`
      <h1>Hi, nice to meet you!</h1>

      <form onsubmit=${saveProfile}>

        <label>${t`Your name`}</label>
        <input type="text" .value=${userProfile.name} onkeyup=${setProfileName} />

        <button class="button primary">Save name</button>

      </form>
    `
  }
}