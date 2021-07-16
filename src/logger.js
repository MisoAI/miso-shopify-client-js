import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'
import { API_ENDPOINT } from './interactionTracker'

const CTX_LIST = ['apiKey', 'domain', 'isDryRun']

let isSentryEnabled = false

function initSentry (domain) {
  const dsn = process.env.SENTRY_DSN
  const release = process.env.release

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
    environment: domain,
    allowUrls: [
      // only log our own event
      /miso-shopify-js-sdk/,
      /misoSDK\/\./
    ],
    beforeSend (event) {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((bread) => {
          if (bread.category !== 'fetch' || !bread.data.url.startsWith(API_ENDPOINT)) {
            return bread
          }
          // publishable key doesn't violate PII
          bread.data.url = bread.data.url.replace('api_key', 'the_key')
          return bread
        })
      }
      return event
    }
  }

  if (release) {
    opt.release = release
  } else {
    opt.release = 'dev'
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

  genError (msg) {
    if (typeof msg === 'string') {
      return new Error(msg)
    }
    return msg
  }

  error (msg) {
    if (isSentryEnabled) {
      Sentry.captureException(this.genError(msg))
    } else {
      console.error(`[ERROR] ${msg}`, this.ctx())
    }
  }

  warn (msg) {
    if (isSentryEnabled) {
      Sentry.captureMessage(this.genError(msg))
    } else {
      console.warn(`[WARN] ${msg}`, this.ctx())
    }
  }
}

const theLogger = new Logger()

export default theLogger
