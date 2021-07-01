/** @ts-ignore */
import { html } from 'uhtml/async'
import { Route } from './Route'
import { RouterContext } from 'universal-router';
import { connection } from '../core/connection'
import { Quiz as QuizType } from '../types'
import { getState } from '../helpers/getState'
import { Profile as userProfile, profiles } from '../core/Profile'
import { goTo } from '../core/goto';
import { t } from '../core/Translate'

type QuizState = {
  quiz: QuizType | null
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default class Quiz extends Route {
  public name = 'quiz'
  public path = '/quiz/:name'

  protected quizPassword = ''

  async template (context: RouterContext) {
    const state: QuizState = getState(this, { quiz: null })

    try {
      const password = sessionStorage.getItem('quiz-' + context.params.name) ?? ''
      state.quiz = !state.quiz ? await connection.enterQuiz(context.params.name, password) : await connection.getQuiz(context.params.name)
    }
    catch (exception) {
      if (exception === 'Password does not match') {
        const gotoProtectedQuiz = (event: Event) => {
          event.preventDefault()
          sessionStorage.setItem('quiz-' + context.params.name, this.quizPassword)

          goTo('quiz', {
            name: context.params.name
          })
        }

        const setQuizPassword = ({ target }: { target: HTMLInputElement }) => {
          this.quizPassword = target.value
        }

        return html`
        <form onsubmit=${gotoProtectedQuiz}>
        <h2>${t`Enter the quiz password`}</h2>

        <label>${t`Quiz password`}</label>
        <input type="text" onkeyup=${setQuizPassword} />

        <button class="button primary">Enter quiz</button>
      </form>
        `
      }
    }

    if (state?.quiz?.require_sharepoint && state?.quiz?.sharepoint_image) {
      // window.location = state?.quiz?.require_sharepoint
      const testImage = document.createElement('img')
      testImage.onerror = () => {
        window.location.replace(state?.quiz?.require_sharepoint ?? '')
      }

      testImage.src = state?.quiz?.sharepoint_image
    }

    if (state.quiz?.profiles.length) {
      for (const profile of state.quiz?.profiles) {
        profiles.set(profile.uuid, profile)
      }
    }

    if (!state.quiz) throw new Error('Unknown quiz')
  
    if (state.quiz.state === 'open') return this.waitingRoom(state)
    if (state.quiz.state === 'question') {
      const question = state.quiz.questions[state.quiz.currentQuestion]
      const imageOnly = question?.image && !question.choices ? true : false
      document.body.dataset.imageOnly = imageOnly.toString()
      
      const correctChoices = question.choices && question.choices.filter(choice => choice.correct)
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
      <h1 class="page-title">${state.quiz?.title}</h1>

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
            <h3 class="name">${member?.name}</h3>
          </div>
        `
        })}
      </div>

      ${isHost ? html`
        <form onsubmit=${startQuiz}>
          <button class="button primary">Start quiz</button>
        </form>
      ` : null}
    `
  }

  async question (state: QuizState) {
    if (!state.quiz) throw new Error('Unknown quiz')
    const question = state.quiz.questions[state.quiz.currentQuestion]
    if (!question) throw new Error('Unknown question')
    const isHost = state.quiz?.host === userProfile.uuid

    const selectAnswer = (index: number) => {
      if (!state.quiz) throw new Error('No quiz loaded')
      connection.selectAnswer(state.quiz.room, state.quiz.currentQuestion, index)
    }

    const count = question?.choices?.filter(choice => choice.correct).length

    return html`
    <div class="header">
    <h1 class="page-title">${state.quiz.currentQuestion + 1}. ${question.title}</h1>

    ${count > 1 ? html`<span class="pick-multiple">Pick ${ count } answers</span>` : null} 

    ${question?.video ? html`<iframe width="560" height="315" src=${question.video} frameborder="0" autoplay allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : null}
    ${question?.image ? html`<img class="image" src=${question?.image} />` : null}
    </div>

    ${question.choices ? html`
    <div class="choices">
      ${[...question.choices.entries()].map(([index, option]) => {
        const isSelected = question.answers?.[userProfile.uuid]?.includes(index)

        return html`<button ?has-title=${option.title} ?has-image=${option.image} class=${`choice button primary ${isSelected ? 'selected' : ''}`} onclick=${() => selectAnswer(index)}>
          <span class="index">${alphabet[index]}</span>
          <span class="title">${option.title}</span>
          ${option.image ? html`<img class="image" src=${option.image} />` : null}
        </button>`
      })}
    </div>    
    ` : html``}

    ${isHost ? this.controls(state) : null}
    `
  }

  async controls (state: QuizState) {
    if (!state.quiz) throw new Error('Unknown quiz')
    const question = state.quiz.questions?.[state.quiz.currentQuestion]

    const previousQuestion = () => {
      if (!state.quiz) throw new Error('Unknown quiz')
      connection.previousQuestion(state.quiz.room)
    }

    const nextQuestion = () => {
      if (!state.quiz) throw new Error('Unknown quiz')
      connection.nextQuestion(state.quiz.room)
    }

    const restartQuiz = () => {
      if (confirm('Do you really want to restart the quiz for everyone?')) {
        if (!state.quiz) throw new Error('Unknown quiz')
        connection.restartQuiz(state.quiz.room)
      }
    }

    const stopQuiz = async () => {
      if (confirm('Do you really want to stop the quiz for everyone?')) {
        if (!state.quiz) throw new Error('Unknown quiz')
        await connection.stopQuiz(state.quiz.room)
        goTo('home')  
      }
    }

    const everyOneHasAnswered = question && question.answers ? Object.keys(question.answers).length === state.quiz.members.length : false

    return html`
      <div class="controls">
      <button class="button mini secondary" onclick=${stopQuiz}>Stop quiz</button>
        <button class="button mini secondary" onclick=${restartQuiz}>Restart quiz</button>
        ${state.quiz.currentQuestion !== -1 ? html`<button onclick=${previousQuestion} class="button mini secondary">${'Previous question'}</button>` : null}
        ${state.quiz.currentQuestion !== -1 ? html`<button onclick=${nextQuestion} class=${`button mini secondary ${everyOneHasAnswered ? 'active' : ''}`}>${state.quiz.questions.length === state.quiz.currentQuestion + 1 ? 'Finish quiz' : 'Next question'}</button>` : null}
        
      </div>
    `
  }

  async inBetweenScreen (state: QuizState) {
    if (!state || !state.quiz) throw new Error('Unknown quiz')
    const question = state.quiz.questions[state.quiz.currentQuestion]
    if (!question) throw new Error('Unknown question')
    const isHost = state.quiz?.host === userProfile.uuid

    return html`
    <div class="header">
    <h1 class="page-title">${state.quiz.currentQuestion + 1}. ${question.title}</h1>

    ${question?.image ? html`<img class="image" src=${question?.image} />` : null}
    </div>

    ${question.choices ? html`
    <div class="choices result">
      ${[...question.choices.entries()].map(([index, option]) => {
          const chosenCount = Object.values(question.answers).filter(answer => answer.includes(index)).length
          if (!state || !state.quiz) throw new Error('Unknown quiz')
          const chosenPercentage = Math.round(100 / state.quiz.members.length * chosenCount)

          const chosenPeople = Object.entries(question.answers)
          .filter(([_uuid, answer]) => answer.includes(index))
          .map(([uuid]) => profiles.get(uuid))

          return html`<div class=${`choice button primary ${option.correct ? 'correct' : 'wrong'}`} ?has-title=${option.title} ?has-image=${option.image}>
            <span class="index">${alphabet[index]}</span>
            ${option.image ? html`<img class="image" src=${option.image} />` : null}
            <span class="title">
            ${option.title}
            </span>
          </div>
          
          <div class=${`right ${option.correct ? 'correct' : 'wrong'}`}>
            <div class="progress-bar" style=${`--progress: ${chosenPercentage}%`}>
              <span class="text">${chosenPercentage}%</span>
            </div>
            ${chosenPeople.length ? html`
              <div class="chosen-people">
                ${chosenPeople.map(member => html`<div class=${`person ${member?.uuid === userProfile.uuid ? 'self' : ''}`}></div>`)}
              </div>
            ` : null}
          </div>
          ${option.explainer ? html`<div class="explainer"><div class="inner">${option.explainer}</div></div>` : null}
         
          `
        })}
      </div>
      ` : null}

      ${isHost ? this.controls(state) : null}

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

    return html`
    <h1>${state.quiz.title} - ${state.quiz.questions.length} questions</h1>

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
            <h3 class="name">${member?.name}</h3>
          </div>

          <h3>${state.quiz.score[uuid]} of ${totalPoints} points</h3>

        <div class="progress-bar" style=${`--progress: ${correctPercentage}%`}></div>
        </div>
      `
      })}
    </div>

    ${isHost ? this.controls(state) : null}

    `
  }
}
