import AvO from '@avo'
import CNY2026 from './cny2026'

window.onload = function init () {
  window.avo = new AvO({ story: CNY2026, width: 40 * 32, height: 20 * 32 })
}
