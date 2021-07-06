const CTX_LIST = ['apiKey', 'domain', 'isDryRun']

class Logger {
  ctx () {
    return CTX_LIST.reduce((ctx, key) => {
      if (this[key]) {
        return {
          ...ctx,
          [key]: this[key]
        }
      }
      return ctx
    }, {})
  }

  setCtx (key, val) {
    if (CTX_LIST.indexOf(key) >= 0) {
      this[key] = val
    }
  }

  error (msg) {
    console.error(`[ERROR] ${msg}`, this.ctx())
  }

  warning (msg) {
    console.warn(`[WARN] ${msg}`)
  }
}

const theLogger = new Logger()

export default theLogger
