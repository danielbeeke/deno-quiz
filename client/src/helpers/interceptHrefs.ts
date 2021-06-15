export const interceptHrefs = () => {
  document.body.addEventListener('click', (event: Event) => {
    const element = (event as any).target.nodeName !== 'A' ? (event as any).target.closest('a') : (event as any).target
  
    if (element) {
      const href = element.getAttribute('href')
  
      if (href[0] === '/') {
        event.preventDefault()
        history.pushState(null, '', href)
        document.body.dispatchEvent(new CustomEvent('render'))
      }
    }
  })
}