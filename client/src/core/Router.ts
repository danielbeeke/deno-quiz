import { html } from 'uhtml'
import UniversalRouter from 'universal-router';
import generateUrls from 'universal-router/generateUrls'
import { routes } from '../routes/routes'
import { Error } from '../types'

export const router = new UniversalRouter(routes, {
  errorHandler(error: Error) {
    return error.status === 404
      ? html`<h1>Page Not Found</h1>`
      : html`<h1>Oops! ${error.message ?? error}</h1>`
  }
})

export const url = generateUrls(router)