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

    this.gongxi40bpmMusic = new Howl({
      src: ['assets/gongxigongxi-v2-40bpm.mp3'],
      loop: true,
      sprite: {
        loopingBody: [0, 18000],
      },
    })

    this.gongxi60bpmMusic = new Howl({
      src: ['assets/gongxigongxi-v2-60bpm.mp3'],
      loop: true,
    })

    this.toggleSound = this.toggleSound.bind(this)
    document.getElementById('button-sound').addEventListener('click', this.toggleSound)
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'
  }

  deconstructor () {
    this.gongxi40bpmMusic.stop()
    this.gongxi60bpmMusic.stop()

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

  playGongXiMusic () {
    this.gongxi40bpmMusic.play('loopingBody')
    this.gongxi40bpmMusic.fade(0, 0.5, 1000)
  }

  fadeInMusic () {
    this.gongxi40bpmMusic.fade(0, 0.5, 1000)
  }

  fadeOutMusic () {
    this.gongxi40bpmMusic.fade(0.5, 0, 1000)
  }

  toggleSound () {
    this.muted = !this.muted
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'
    if (this.muted) {
      this.fadeOutMusic()
    } else {
      this.fadeInMusic()
    }
  }
}
