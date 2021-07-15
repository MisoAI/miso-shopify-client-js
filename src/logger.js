import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'

const CTX_LIST = ['apiKey', 'domain', 'isDryRun']

let isSentryEnabled = false

function initSentry (domain) {
  const dsn = process.env.SENTRY_DSN
  const release = process.env.RELEASE

  if (!dsn) {
    return
  }
  const opt = {
    dsn,
    integrations: [new Integrations.BrowserTracing()],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    environment: domain
  }

  if (release) {
    opt.release = release
  }
  Sentry.init(opt)
  isSentryEnabled = true
}

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
    if (key === 'domain') {
      initSentry(val)
    }
  }

  error (msg) {
    if (isSentryEnabled) {
      Sentry.captureException(msg)
    } else {
      console.error(`[ERROR] ${msg}`, this.ctx())
    }
  }

  warn (msg) {
    if (isSentryEnabled) {
      Sentry.captureMessage(msg)
    } else {
      console.warn(`[WARN] ${msg}`)
    }
  }
}

const theLogger = new Logger()

export default theLogger
