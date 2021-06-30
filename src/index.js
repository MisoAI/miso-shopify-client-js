import logger from './logger'
import Tracker from './interactionTracker'
import { genUuid, getConfigFromScript } from './utils'

(function (window, document) {
  const ANONYMOUS_SESSION_KEY = 'misoAnonymousKey'

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

  function setupEnv () {
    if (!window || !window.ShopifyAnalytics) {
      logger.error('Cannot find ShopifyAnalytics')
      return
    }
    const pageMeta = window.ShopifyAnalytics.meta.page || {}
    const { pageType, resourceId } = pageMeta
    const { customerId, anonymousId } = getUserId()
    if (!pageType) {
      logger.error('Cannot find page type')
      return
    }

    const apiKey = getConfigFromScript('api_key')
    const isDryRun = process.env.NODE_ENV === 'development' || !apiKey

    logger.setCtx('isDryRun', isDryRun)
    logger.setCtx('domain', window.location.host)
    if (apiKey) {
      logger.setCtx('apiKey', apiKey)
    } else {
      logger.error('API Key not found')
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

  function main () {
    const ctx = setupEnv()
    if (!ctx) {
      return
    }

    const tracker = new Tracker(window, ctx)
    tracker.registerPageHandler()
  }

  main()
})(window, document)
