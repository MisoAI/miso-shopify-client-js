import { genUuid } from '../utils'

const origOpen = XMLHttpRequest.prototype.open
const listenerCtx = []

XMLHttpRequest.prototype.open = function (...args) {
  listenerCtx.forEach((ctx) => {
    if (ctx.urlMatcher(args)) {
      const thisCallback = () => {
        ctx.callback.call(this)
        this.removeEventListener('load', thisCallback)
      }
      this.addEventListener('load', thisCallback)
    }
  })
  return origOpen.apply(this, args)
}

export function hookXHR (urlMatcher, callback) {
  const id = genUuid()
  listenerCtx.push({ urlMatcher, callback, id })
}

export function unhookXHR (id) {
  const index = listenerCtx.findIndex((ctx) => ctx.id === id)
  if (index >= 0) {
    listenerCtx.splice(index, 1)
  }
}
