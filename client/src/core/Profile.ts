import { v4 as uuidv4 } from 'uuid';
import { connection } from '../core/connection'

export const profiles: Map<string, { uuid: string, name: string, avatar: string }> = new Map()

class ProfileManager {
  public name: string = ''
  public avatar: string = ''
  public uuid: string = ''

  constructor () {
    const profile = localStorage.profile ? JSON.parse(localStorage.profile) : false

    if (profile) {
      this.name = profile.name
      this.avatar = profile.avatar
      this.uuid = profile.uuid
    }

    if (!this.uuid) {
      this.uuid = uuidv4()
    }

    profiles.set(this.uuid, this.get())
  }

  get () {
    return {
      name: this.name,
      avatar: this.avatar,
      uuid: this.uuid
    }
  }

  save () {
    localStorage.profile = JSON.stringify(this.get())
    connection.saveProfile(this.get())
  }
}

export const Profile = new ProfileManager()