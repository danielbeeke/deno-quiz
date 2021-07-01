import { profiles } from '../index.ts'

export const saveProfile = (name: string, uuid: string) => {
  profiles.set(uuid, { name, uuid })
  return true
}