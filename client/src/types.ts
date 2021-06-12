import { Renderable } from 'uhtml'
import { RouterContext } from 'universal-router';

export interface Error {
  name: string;
  message: string;
  stack?: string;
  status?: number | undefined;
}

export type Route = {
  name: string,
  path: string,
  action: (context: RouterContext) => Renderable
}