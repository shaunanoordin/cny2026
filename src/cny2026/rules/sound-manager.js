/*
Sound Manager Manager
Plays sounds.
 */

import Rule from '@avo/rule'
import { Howl } from 'howler'

const MUSIC_STATES = {
  INIT: 'init',
  STARTING_MUSIC: 'starting-music',
  ESCALATION_MUSIC: 'escalation-music',
  FINISHING_MUSIC: 'finishing-music',
}

const MAX_VOL = 0.5
const CNY2026_HIGHSCORE_MUTED_KEY = 'cny2026.muted'

function getMutedValueFromStorage () {
  const storage = window?.localStorage
  if (!storage) return

  try {
    const mutedValue = storage.getItem(CNY2026_HIGHSCORE_MUTED_KEY)
    return mutedValue === 'true'
  } catch (err) {}

  return false
}

function setMutedValueToStorage (value) {
  const storage = window?.localStorage
  if (!storage) return

  try {
    const mutedValue = storage.setItem(CNY2026_HIGHSCORE_MUTED_KEY, !!value ? 'true' : 'false')
  } catch (err) {}
}

export default class SoundManager extends Rule {
  constructor (app) {
    super(app)
    this._type = 'sound-manager'
    this.muted = getMutedValueFromStorage()
    this.musicVolume = MAX_VOL
    this.musicState = MUSIC_STATES.INIT

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

    this.williamTellOvertureMusic = new Howl({
      src: ['assets/william-tell-overture-finale.mp3'],
      sprite: {
        escalation: [0, 52000, true],
        finishing: [52000, 62000, false],
      },
    })

    this.toggleSound = this.toggleSound.bind(this)
    document.getElementById('button-sound').addEventListener('click', this.toggleSound)
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'

    this.startingMusicId = undefined
    this.escalationMusicId = undefined
    this.finishingMusicId = undefined

    this.updateSoundState()
  }

  deconstructor () {
    this.gongxi40bpmMusic.stop()
    this.williamTellOvertureMusic.stop()
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

  playStartingMusic () {
    if (this.musicState === MUSIC_STATES.INIT) {
      this.startingMusicId = this.gongxi40bpmMusic.play('loopingBody')
      this.gongxi40bpmMusic.fade(0, this.musicVolume, 1000, this.startingMusicId)
      this.musicState = MUSIC_STATES.STARTING_MUSIC
    }
  }

  playEscalationMusic () {
    if (this.musicState === MUSIC_STATES.STARTING_MUSIC) {
      this.gongxi40bpmMusic.fade(this.musicVolume, 0, 2000)

      this.escalationMusicId = this.williamTellOvertureMusic.play('escalation')
      this.williamTellOvertureMusic.fade(0, this.musicVolume, 2000, this.escalationMusicId)

      this.musicState = MUSIC_STATES.ESCALATION_MUSIC
    }
  }

  playFinishingMusic () {
    if (this.musicState === MUSIC_STATES.ESCALATION_MUSIC) {
      this.williamTellOvertureMusic.fade(this.musicVolume, 0, 1000, this.escalationMusicId)

      this.finishingMusicId = this.williamTellOvertureMusic.play('finishing')
      this.williamTellOvertureMusic.fade(0, this.musicVolume, 1000, this.finishingMusicId)

      this.musicState = MUSIC_STATES.FINISHING_MUSIC

    } else {
      this.fadeOutMusic()
    }
  }

  fadeInMusic () {
    switch (this.musicState) {
      case MUSIC_STATES.STARTING_MUSIC:
        this.gongxi40bpmMusic.fade(0, this.musicVolume, 1000)
        break
      case MUSIC_STATES.ESCALATION_MUSIC:
      case MUSIC_STATES.FINISHING_MUSIC:
        this.williamTellOvertureMusic.fade(0, this.musicVolume, 1000)
        break
    }
    
  }

  fadeOutMusic () {
    let currentVolume = this.gongxi40bpmMusic.volume() || 0
    this.gongxi40bpmMusic.fade(currentVolume, 0, 1000)

    currentVolume = this.williamTellOvertureMusic.volume() || 0
    this.williamTellOvertureMusic.fade(currentVolume, 0, 1000)
  }

  toggleSound () {
    this.muted = !this.muted
    setMutedValueToStorage(this.muted)
    this.updateSoundState()
  }

  updateSoundState () {
    document.getElementById('button-sound').dataset.muted = (this.muted) ? 'true' : 'false'
    if (this.muted) {
      this.musicVolume = 0
      this.fadeOutMusic()
    } else {
      this.musicVolume = MAX_VOL
      this.fadeInMusic()
    }
  }
}
