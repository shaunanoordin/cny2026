/*
High Score System
Functions for saving & loading the player's high score from local storage.

- saveHighScore(score) saves an integer to local storage.
  - The new score has to be more than 0.
  - The new score will be saved only if it's higher than the older score. 
- loadHighScore() returns the saved integer, OR undefined (if no high score
  exists).
- updateHighScoreHtml() updates the HTML element displaying the high score.
  - If there's no high score, the element is hidden.
  - If there is a high score, the element becomes visible with that value.
 */

const CNY2026_HIGHSCORE_HTML_ID = '#cny2026-high-score'
const CNY2026_HIGHSCORE_STORAGE_KEY = 'cny2026.highscore'

export function saveHighScore (score) {
  const storage = window?.localStorage
  if (!storage) return

  try {
    const oldScore = loadHighScore()
    const newScore = parseInt(score)
    if (!(newScore > 0)) return

    if (oldScore === undefined) {
      storage.setItem(CNY2026_HIGHSCORE_STORAGE_KEY, newScore)
    } else {
      storage.setItem(CNY2026_HIGHSCORE_STORAGE_KEY, Math.max(oldScore, newScore))
    }

    updateHighScoreHtml()

  } catch (err) {}

}

export function loadHighScore () {
  const storage = window?.localStorage
  if (!storage) return

  try {
    const score = parseInt(storage.getItem(CNY2026_HIGHSCORE_STORAGE_KEY))
    if (isNaN(score)) return undefined
    return score

  } catch (err) {
    return undefined
  }

}

export function updateHighScoreHtml () {
  const html = document.querySelector(CNY2026_HIGHSCORE_HTML_ID)
  const score = loadHighScore()
  if (!html) return

  console.log('+++ update High Score: ', score)

  if (Number.isInteger(score)) {
    html.style.display = 'block'
    html.innerText = `High score: ${score}`

  } else {
    html.style.display = 'none'
    html.innerText = ''

  }
}