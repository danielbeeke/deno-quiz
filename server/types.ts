export type QuizData = {
  title: string
  score: { [key: string]: number },
  questions: Array<{ 
    title: string, 
    answers: { [key: string]: number }, 
    choices: Array<{ title?: string, image?: string, correct?: boolean }>
  }>
}