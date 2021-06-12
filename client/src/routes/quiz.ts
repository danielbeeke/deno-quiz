import { html } from 'uhtml'
import { Route } from './Route'
import { RouterContext } from 'universal-router';

export default class Quiz extends Route {
  public name = 'quiz'
  public path = '/quiz/:name'

  template (context: RouterContext) {
    return html`<h1>Post #${context.params.id}</h1>`
  }
}
