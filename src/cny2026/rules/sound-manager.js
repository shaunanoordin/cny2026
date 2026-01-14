/*
Sound Manager Manager
Plays sounds.
 */


import Rule from '@avo/rule'
import { Howl } from 'howler'

export default class SoundManager extends Rule {
  constructor (app) {
    super(app)
    this._type = 'sound-manager'
    this.muted = false

    this.pickUpSound = new Howl({
      src: ['assets/sound-pick-up.wav']
    })

    this.dropOffSound = new Howl({
      src: ['assets/sound-drop-off.wav']
    })

    this.destinationReachedSound = new Howl({
      src: ['assets/sound-destination-reached.wav']
    })

    this.toggleMute = this.toggleMute.bind(this)
    document.getElementById('button-sound').addEventListener('click', this.toggleMute)
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'
  }

  deconstructor () {


  }

  playPickUp () {
    if (this.muted) return
    this.pickUpSound.play()
  }

  playDropOff () {
    if (this.muted) return
    // this.dropOffSound.play()
  }

  playDestinationReached () {
    if (this.muted) return
    // this.dropOffSound.stop()
    this.destinationReachedSound.play()
  }

  toggleMute () {
    this.muted = !this.muted
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'
  }
}
