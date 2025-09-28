import { makeAutoObservable, reaction } from 'mobx'

export class UserStore {
  exampleValue = 0

  constructor() {
    makeAutoObservable(this)

    reaction(
      () => this.exampleValue,
      (value) => {
        console.log('Example MobX reaction triggered:', value)
      }
    )
  }

  incrementExample() {
    this.exampleValue++
  }
}