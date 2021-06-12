import '../css/avatar-input.css'

class AvatarInput extends HTMLElement {

  protected video: HTMLVideoElement = document.createElement('video')
  protected button: HTMLButtonElement = document.createElement('button')
  protected canvas: HTMLCanvasElement = document.createElement('canvas')
  protected context: CanvasRenderingContext2D | null = null

  protected cameraWidth: number | undefined = 0
  protected cameraHeight: number | undefined = 0

  async connectedCallback () {
    this.video = document.createElement('video')
    this.video.setAttribute('autoplay', '')
    this.appendChild(this.video)

    this.canvas = document.createElement('canvas')
    this.appendChild(this.canvas)
    this.dataset.state = 'capturing'

    this.context = this.canvas.getContext('2d');

    this.button = document.createElement('button')
    this.appendChild(this.button)
    
    await this.init()
    const value = this.getAttribute('value')
    if (value && this.context) {
      const img = new Image
      img.onload = () => {
        this.context.drawImage(img, 0, 0), 200, 200;
        this.dataset.state = 'captured'
        this.video.style.display = 'none'  
      };
      img.src = value
    }

    if (this.cameraWidth) this.canvas.width = this.cameraWidth
    if (this.cameraHeight) this.canvas.height = this.cameraHeight

    this.button.addEventListener('click', async (event) => {
      event.preventDefault()

      if (this.dataset.state === 'capturing' && this.context) {
        this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
        this.video.style.display = 'none'  
        this.video?.srcObject?.getVideoTracks().forEach(track => track.stop())
        this.canvas.removeAttribute('style')
        this.dataset.state = 'captured'

        const imageUrl = this.canvas.toDataURL()

        this.dispatchEvent(new CustomEvent('capture', {
          detail: imageUrl
        }))  
      }

      else if (this.dataset.state === 'captured') {
        this.canvas.style.display = 'none'  
        await this.init()
        this.video.removeAttribute('style')
        this.dataset.state = 'capturing'
      }
    });
  }

  capture () {
    
  }

  async init () {
    if (!this.context || !this.video) return
    this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true })
    let { width, height } = this.video?.srcObject?.getVideoTracks()[0].getSettings()
    this.cameraWidth = width
    this.cameraHeight = height
  }
}

customElements.define('avatar-input', AvatarInput)