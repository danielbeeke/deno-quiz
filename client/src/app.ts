import { render, Renderable } from 'uhtml'
import { router } from './core/Router'
import { interceptProfile } from './helpers/interceptProfile'
import './css/style.css'

export const renderApp = async () => {
  interceptProfile()
  const template: Renderable | null | undefined = await router.resolve(location.pathname)
  if (template) render(document.body, template)
}

window.addEventListener('popstate', renderApp)
document.body.addEventListener('render', renderApp)
renderApp()