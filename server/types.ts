export type QuizData = {
  title: string
  score: { [key: string]: number },
  questions: Array<{ 
    title: string, 
    answers: { [key: string]: Array<number> }, 
    choices: Array<{ title?: string, image?: string, correct?: boolean }>
  }>
}