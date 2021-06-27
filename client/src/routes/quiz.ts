import { html } from 'uhtml'
import { Route } from './Route'
import { RouterContext } from 'universal-router';
import { connection } from '../core/connection'
import { Quiz as QuizType } from '../types'
import { getState } from '../helpers/getState'
import { Profile as userProfile, profiles } from '../core/Profile'
import { goTo } from '../core/goto';

type QuizState = {
  quiz: QuizType | null
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default class Quiz extends Route {
  public name = 'quiz'
  public path = '/quiz/:name'

  async template (context: RouterContext) {
    const state: QuizState = getState(this, { quiz: null })

    state.quiz = !state.quiz ? await connection.enterQuiz(context.params.name) : await connection.getQuiz(context.params.name)

    if (state.quiz?.profiles.length) {
      for (const profile of state.quiz?.profiles) {
        profiles.set(profile.uuid, profile)
      }
    }

    if (!state.quiz) throw new Error('Unknown quiz')
  
    if (state.quiz.state === 'open') return this.waitingRoom(state)
    if (state.quiz.state === 'question') {
      const question = state.quiz.questions[state.quiz.currentQuestion]
      const correctChoices = question.choices.filter(choice => choice.correct)
      return question && question.answers && userProfile.uuid in question.answers && question.answers[userProfile.uuid]?.length === correctChoices.length ? this.inBetweenScreen(state) : this.question(state)
    }

    if (state.quiz.state === 'done') {
      return this.finished(state)
    }

    return html`<h1>${state.quiz.title}</h1>`
  }

  async waitingRoom (state: QuizState) {
    const isHost = state.quiz?.host === userProfile.uuid
    
    const startQuiz = (event: Event) => {
      event.preventDefault()
      if (!state.quiz) throw new Error('Unknown quiz')
      connection.startQuiz(state.quiz.room)
    }

    return html`
      <h1>${state.quiz?.title}</h1>

      <div class="message">
        ${isHost ? 'Please wait while people join. Start when you want.' : 'Please wait while people join. The host will start the game soon.'}
      </div>

      <div class="joined">
        ${state.quiz?.members
          .filter(uuid => profiles.has(uuid))
          .map(uuid => {
          const member = profiles.get(uuid)

          return html`
          <div class="profile card">
            <img class="avatar" src=${member?.avatar} />
            <h3 class="name">${member?.name}</h3>
          </div>
        `
        })}
      </div>

      ${isHost ? html`
        <form onsubmit=${startQuiz}>
          <div>
            <button class="button primary">Start quiz</button>
          </div>
        </form>
      ` : null}
    `
  }

  async question (state: QuizState) {
    if (!state.quiz) throw new Error('Unknown quiz')
    const question = state.quiz.questions[state.quiz.currentQuestion]
    if (!question) throw new Error('Unknown question')

    const selectAnswer = (index: number) => {
      if (!state.quiz) throw new Error('No quiz loaded')
      connection.selectAnswer(state.quiz.room, state.quiz.currentQuestion, index)
    }

    return html`
    <h1>${state.quiz.currentQuestion + 1}. ${question.title}</h1>

    ${question?.image ? html`<img class="question-image" src=${question?.image} />` : null}

    <div class="choices">
        ${[...question.choices.entries()].map(([index, option]) => {
          const isSelected = question.answers?.[userProfile.uuid]?.includes(index)

          return html`<button ?has-title=${option.title} ?has-image=${option.image} class=${`choice ${isSelected ? 'selected' : ''}`} onclick=${() => selectAnswer(index)}>
            <span class="index">${alphabet[index]}</span>
            <span class="title">${option.title}</span>
            ${option.image ? html`<img class="image" src=${option.image} />` : null}
          </button>`
        })}
      </div>
    `
  }

  async inBetweenScreen (state: QuizState) {
    if (!state || !state.quiz) throw new Error('Unknown quiz')
    const question = state.quiz.questions[state.quiz.currentQuestion]
    if (!question) throw new Error('Unknown question')
    const isHost = state.quiz?.host === userProfile.uuid

    const nextQuestion = (event: Event) => {
      event.preventDefault()
      if (!state || !state.quiz) throw new Error('Unknown quiz')
      connection.nextQuestion(state.quiz.room)
    }

    return html`
      <h1>${state.quiz.currentQuestion + 1}. ${question.title}</h1>

      <div class="choices result">
      ${[...question.choices.entries()].map(([index, option]) => {
          const chosenCount = Object.values(question.answers).filter(answer => answer.includes(index)).length
          if (!state || !state.quiz) throw new Error('Unknown quiz')
          const chosenPercentage = Math.round(100 / state.quiz.members.length * chosenCount)

          const chosenPeople = Object.entries(question.answers)
          .filter(([_uuid, answer]) => answer.includes(index))
          .map(([uuid]) => profiles.get(uuid))

          return html`<div class=${option.correct ? 'choice correct' : 'choice wrong'} ?has-title=${option.title} ?has-image=${option.image}>
            <span class="index">${alphabet[index]}</span>
            ${option.image ? html`<img class="image" src=${option.image} />` : null}
            <span class="title">
            ${option.title}
            ${option.explainer ? html`<span class="explainer">${option.explainer}</span>` : null}
            </span>
            <div class="right">
              ${chosenPeople.length ? html`
                <div class="chosen-people">
                  ${chosenPeople.map(member => html`
                    <img class=${`person ${member?.uuid === userProfile.uuid ? 'self' : ''}`} src=${member?.avatar} />
                  `)}
                </div>
              ` : null}
              <div class="progress-bar" style=${`--progress: ${chosenPercentage}%`}></div>
            </div>
          </div>`
        })}
      </div>

      ${isHost && state.quiz.members.length === Object.values(question.answers).length ? html`
        <form onsubmit=${nextQuestion}>
          <button class="button primary">${state.quiz.questions.length === state.quiz.currentQuestion + 1 ? 'Finish quiz' : 'Next question'}</button>
        </form>
      ` : null}

    `
  }

  async finished (state: QuizState) {
    if (!state || !state.quiz) throw new Error('Unknown quiz')
    const isHost = state.quiz?.host === userProfile.uuid

    const sortedMembers = state.quiz?.members
    .filter(uuid => profiles.has(uuid))
    .sort((a: string, b: string) => {
      if (!state || !state.quiz || !state.quiz.score) throw new Error('Unknown quiz')
      return state.quiz.score[b] - state.quiz.score[a]
    })

    const highScore = state.quiz.score[sortedMembers[0]]

    const restartQuiz = (event: Event) => {
      event.preventDefault()
      if (!state || !state.quiz) throw new Error('Unknown quiz')
      connection.restartQuiz(state.quiz.room)
    }

    const stopQuiz = async (event: Event) => {
      event.preventDefault()
      if (!state || !state.quiz) throw new Error('Unknown quiz')
      await connection.stopQuiz(state.quiz.room)
      goTo('home')
    }


    return html`
    <h1>${state.quiz.title}</h1>

    <div class="members">
      ${sortedMembers.map(uuid => {
        const member = profiles.get(uuid)
        if (!state || !state.quiz || !state.quiz.score) throw new Error('Unknown quiz')
        const score = state.quiz.score[uuid]

        let totalPoints = 0
        for (const question of state.quiz.questions) {
          totalPoints += question.choices.filter(choice => choice.correct).length
        }

        const correctPercentage = Math.round(100 / totalPoints * score)

        return html`
        <div class="${`score-row correct ${highScore === score ? ' winner' : ''}`}">
          <div class=${`profile card`}>
            <img class="avatar" src=${member?.avatar} />
            <h3 class="name">${member?.name}</h3>
          </div>
        <div class="progress-bar" style=${`--progress: ${correctPercentage}%`}></div>
        </div>
      `
      })}
    </div>

    ${isHost ? html`
    <form>
      <button class="button primary" onclick=${restartQuiz}>Restart quiz</button>
      <button class="button primary" onclick=${stopQuiz}>Stop quiz</button>
    </form>
  ` : null}

    `
  }
}
