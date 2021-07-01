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
  action: (context: RouterContext) => Promise<Renderable>
}

export type Quiz = {
  state: string
  title: string
  require_sharepoint?: string
  sharepoint_image?: string
  host: string
  room: string
  score: { [key: string]: number }
  currentQuestion: number,
  members: Array<string>
  questions: Array<{
    title?: string
    image?: string
    video?: string
    answers: {
      [key: string]: Array<number>
    }
    choices: Array<{
      title?: string
      image?: string
      correct?: boolean  
      explainer?: string
    }>
  }>
  profiles: Array<{ name: string, uuid: string }>
}