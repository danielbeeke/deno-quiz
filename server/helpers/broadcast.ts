import { sockets } from '../index.ts'

export const broadcast = async (message: {}, uids: Array<string> = []) => {
  for (const socket of sockets.values()) {
    if (socket.id && uids.includes(socket.id) && !socket.isClosed) socket.send(JSON.stringify(message))
  }
}