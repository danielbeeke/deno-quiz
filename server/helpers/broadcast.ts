import { sockets } from '../index.ts'

export const broadcast = async (message: {}, uids: Array<string | undefined> = []) => {
  for (const socket of sockets.values()) {
    if (socket && socket.id && uids.includes(socket.id) && !socket.isClosed) socket.send(JSON.stringify(message))
  }
}