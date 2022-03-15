import logger from './logger'
import Tracker from './interactionTracker'
import { genUuid, getConfigFromScript } from './utils'

const ANONYMOUS_SESSION_KEY = 'misoAnonymousKey'
let theTracker

function getUserId () {
  const ret = {}
  try {
    const curr =
      window.ShopifyAnalytics.meta.page.customerId ||
      window.meta.page.customerId ||
      window._st.cid
    if (curr) {
      ret.customerId = `${curr}`
    }
  } catch (e) { }

  try {
    const curr = window.ShopifyAnalytics.lib.user().traits().uniqToken
    if (curr) {
      ret.anonymousId = `${curr}`
    }
  } catch (e) { }

  if (!ret.anonymousId) {
    ret.anonymousId = window.sessionStorage.getItem(ANONYMOUS_SESSION_KEY) || genUuid()
    window.sessionStorage.setItem(ANONYMOUS_SESSION_KEY, ret.anonymousId)
  }
  return ret
}

function setupEnv ({ apiKey, isDryRun } = {}) {
  if (!window || !window.ShopifyAnalytics) {
    logger.error('Cannot find ShopifyAnalytics')
    return
  }
  const pageMeta = window.ShopifyAnalytics.meta.page || {}
  const { pageType = '_unknown', resourceId } = pageMeta
  const { customerId, anonymousId } = getUserId()

  if (apiKey === undefined) {
    apiKey = getConfigFromScript('api_key')
  }
  if (isDryRun === undefined) {
    isDryRun = process.env.NODE_ENV === 'development' || !apiKey || getConfigFromScript('dry_run') === 'true'
  }

  logger.setCtx('isDryRun', isDryRun)
  logger.setCtx('domain', window.location.host)
  if (apiKey) {
    logger.setCtx('apiKey', apiKey)
  } else {
    logger.error('API Key not found')
    logger.setCtx('apiKey', '')
  }

  return {
    pageType,
    resourceId,
    customerId,
    anonymousId,
    apiKey,
    isDryRun
  }
}

export function init ({ apiKey, isDryRun } = {}) {
  const ctx = setupEnv({ apiKey, isDryRun })
  if (!ctx) {
    return
  }

  if (theTracker) {
    theTracker.unregister()
  }

  // register our own
  theTracker = new Tracker(window, ctx)
  theTracker.register()

  return theTracker
}

export function getTracker () {
  return theTracker
}

if (getConfigFromScript('api_key')) {
  // auto init myself when there's sufficient info
  init()
}
