import { profiles } from '../index.ts'

export const saveProfile = (name: string, avatar: string, uuid: string) => {
  profiles.set(uuid, { name, avatar, uuid })
  return true
}