(function () {
  function reportError (msg) {
    // TODO: add domain and api key as context
    console.error(`[ERROR] ${msg}`)
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

  console.log(setupEnv())
})()
