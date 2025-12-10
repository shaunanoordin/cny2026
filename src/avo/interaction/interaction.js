export default class Interaction {
  constructor (app) {
    this._app = app
    this._type = 'interaction'
    this.name = ''  // Optional identifier
  }

  load (div) {
    const menu = document.createElement('div')
    menu.innerHTML = `
      <h3>Example Interaction Menu</h3>
      <p>Debug Controls:</p>
      <ul>
        <li><b>[X]</b> Open example interaction menu</li>
        <li><b>[Z]</b> Action</li>
      </ul>
    `

    const closeButton = document.createElement('button')
    closeButton.type = 'button'
    closeButton.innerText = 'OK!'
    closeButton.onclick = () => { this._app.setInteractionMenu(false) }
    menu.appendChild(closeButton)

    div.appendChild(menu)
    setTimeout(() => { closeButton.focus() }, 100)
  }

  unload () {}
}
