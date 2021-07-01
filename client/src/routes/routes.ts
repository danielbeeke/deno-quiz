import home from './home'
import profile from './profile'
import quiz from './quiz'
import create from './create'
import { Route } from '../types'

export const routes: Array<Route> = [
  new home(),
  new profile(),
  new quiz(),
  new create()
]