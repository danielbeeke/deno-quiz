import { RouterContext } from 'universal-router';
import { html, Renderable } from 'uhtml'

export class Route {
  protected name = 'name'
  protected path = ''

  action (context: RouterContext) {
    document.body.dataset.route = context.route.name
    return this.template(context)
  }

  async template (context: RouterContext): Promise<Renderable> {
    return html`Please implement template for the route: ${context.route.name}`
  }
}
