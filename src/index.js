(function (window, document) {
  const API_KEY = getAPIKey()

  function getAPIKey () {
    const API_KEY_TOKEN = 'api_key='
    const me = document.currentScript
    const urlParser = document.createElement('a')
    urlParser.href = me.src
    const searchTokens = urlParser.search.slice(1).split('&')
    const apiString = searchTokens.find(token => token.startsWith(API_KEY_TOKEN))
    if (!apiString) {
      reportError('API Key not found', {})
      return
    }
    const apiTokens = apiString.split('=')
    if (apiTokens.length !== 2 || !apiTokens[1]) {
      reportError('Invalid API Key format')
    }
    return apiTokens[1]
  }
  function reportError (msg, ctx) {
    // TODO: add domain and api key as context
    console.error(`[ERROR] ${msg}`, ctx || { apiKey: API_KEY })
  }

  function genUuid () {
    const tempUrl = URL.createObjectURL(new Blob())
    const uuid = tempUrl.toString()
    URL.revokeObjectURL(tempUrl)
    // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
  }

  function getUserId () {
    try {
      const curr =
        window.ShopifyAnalytics.meta.page.customerId ||
        window.meta.page.customerId ||
        window._st.cid
      if (curr) {
        return { customerId: curr }
      }
    } catch (e) { }

    try {
      const curr = window.ShopifyAnalytics.lib.user().traits().uniqToken
      if (curr) {
        return { anonymousId: curr }
      }
    } catch (e) { }

    return { anonymousId: genUuid() }
  }

  function setupEnv () {
    if (!window || !window.ShopifyAnalytics) {
      reportError('Cannot find ShopifyAnalytics')
      return
    }
    const pageMeta = window.ShopifyAnalytics.meta.page || {}
    const { pageType, resourceId } = pageMeta
    const { customerId, anonymousId } = getUserId()
    if (!pageType) {
      reportError('Cannot find page type')
      return
    }
    return { pageType, resourceId, customerId, anonymousId }
  }

  function main () {
    const ctx = setupEnv()
    console.log(ctx, API_KEY)
  }

  main()
})(window, document)
