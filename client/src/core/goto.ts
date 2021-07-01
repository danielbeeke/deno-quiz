import { RouteParams } from "universal-router";
import { url } from './Router'

export const goTo = (routeName: string, routeParams: RouteParams = {}) => {
  const href = url(routeName, routeParams)
  if (href) history.pushState(null, '', href)
  document.body.dispatchEvent(new CustomEvent('render'))
}