import { genUuid } from '../utils'

const origOpen = XMLHttpRequest.prototype.open
const listenerCtx = []

XMLHttpRequest.prototype.open = function (...args) {
  listenerCtx.forEach((ctx) => {
    if (matchTargetEndpoint(args, ctx.urlEndpoint)) {
      const thisCallback = () => {
        ctx.callback.call(this)
        this.removeEventListener('load', thisCallback)
      }
      this.addEventListener('load', thisCallback)
    }
  })
  return origOpen.apply(this, args)
}

function matchTargetEndpoint (openArgs, targetEndpoint, targetMethod = 'POST') {
  const host = window.location.host
  const optionalPostfix = ['.js', '.json']
  if (openArgs.length < 2 || openArgs[0] !== targetMethod) {
    return false
  }
  let url = openArgs[1]
  optionalPostfix.forEach((postfix) => {
    if (url.endsWith(postfix)) {
      url = url.slice(0, postfix.length * -1)
    }
  })
  return url === targetEndpoint || (url.startsWith(host) && url.endsWith(targetEndpoint))
}

export function hookXHR (urlEndpoint, callback) {
  const id = genUuid()
  listenerCtx.push({ urlEndpoint, callback, id })
}

export function unhookXHR (id) {
  const index = listenerCtx.findIndex((ctx) => ctx.id === id)
  if (index >= 0) {
    listenerCtx.splice(index, 1)
  }
}
