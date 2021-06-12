class Connection extends EventTarget {

  protected socket: WebSocket

  constructor (server: string) {
    super()
    this.socket = new WebSocket('ws:' + server)
    this.socket.addEventListener('message', (event: MessageEvent) => {
      try {
        const command = JSON.parse(event.data)

        if (command.command === 'error') {
          this.dispatchEvent(new CustomEvent('error', {
            detail: command.message
          }))  
        }

        if (command.command === 'success') {
          this.dispatchEvent(new CustomEvent('success', {
            detail: command.message
          }))  
        }
      }
      catch (exception) { 
        
      }
    })
  }

  createQuiz (name: string, data: object) {
    return new Promise((resolve, reject) => {
      this.socket.addEventListener('message', (event: MessageEvent) => {
        const command = JSON.parse(event.data)
        if (command.command === 'error') {
          reject(command.message)
        }
        else if (command.command === 'success') {
          resolve(command.message)
        }
      }, { once: true})

      this.socket.send(JSON.stringify({
        command: 'createQuiz', name, data
      }))
    })
  }
}

export const connection = new Connection(`${location.hostname}:8080`)