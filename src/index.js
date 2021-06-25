(function (window, document) {
  const API_KEY = getAPIKey()
  const DRY_RUN = true
  const ANONYMOUS_SESSION_KEY = 'misoAnonymousKey'
  const API_ENDPOINT = 'https://api.askmiso.com/v1/'

  function getAPIKey () {
    const API_KEY_TOKEN = 'api_key'
    const me = document.currentScript
    const urlParser = document.createElement('a')
    urlParser.href = me.src
    const apiKey = getValFromQuery(API_KEY_TOKEN, urlParser.search)
    if (!apiKey) {
      reportError('API Key not found', {})
      return
    }
    return apiKey
  }

  function getSlugFromPath (slugKey) {
    const pathTokens = window.location.pathname.split('/')
    // example: /collection/col-id/product-prod-id
    for (let i = pathTokens.length - 2; i > 0; i -= 2) {
      if (pathTokens[i] === slugKey) {
        return pathTokens[i + 1]
      }
    }
  }
  function getValFromQuery (valKey, query) {
    query = query || window.location.search
    valKey = `${valKey}=`
    const searchTokens = query.slice(1).split('&')
    const targetString = searchTokens.find(token => token.startsWith(valKey))
    if (!targetString) {
      return
    }
    return targetString.slice(valKey.length)
  }

  function reportError (msg, ctx) {
    // TODO: add domain and api key as context
    console.error(`[ERROR] ${msg}`, ctx || { apiKey: API_KEY })
  }

  function reportWarning (msg) {
    console.warn(`[WARN] ${msg}`)
  }

  function genUuid () {
    const tempUrl = URL.createObjectURL(new Blob())
    const uuid = tempUrl.toString()
    URL.revokeObjectURL(tempUrl)
    // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
  }

  function getUserId () {
    const ret = {}
    try {
      const curr =
        window.ShopifyAnalytics.meta.page.customerId ||
        window.meta.page.customerId ||
        window._st.cid
      if (curr) {
        ret.customerId = curr
      }
    } catch (e) { }

    try {
      const curr = window.ShopifyAnalytics.lib.user().traits().uniqToken
      if (curr) {
        ret.anonymousId = curr
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

  async function sendInteraction (type, payload, ctx) {
    payload = {
      ...payload,
      type,
      user_id: ctx.customerId,
      anonymous_id: ctx.anonymousId
    }
    const url = `${API_ENDPOINT}interactions?api_key=${window.encodeURIComponent(API_KEY)}`
    const body = JSON.stringify(payload)
    if (DRY_RUN) {
      console.log(`[SEND INTERACTION] to ${url} : ${type} - ${body}`)
      return
    }
    const resp = await window.fetch(url, {
      body,
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      mode: 'cors'
    })
    if (resp.status !== 200) {
      reportError(`Invalid "${type}" interaction response, payload: ${body}`)
    }
  }

  async function getProductDetail (productSlug) {
    const productEndpoint = `//${window.location.host}/products/${productSlug}`
    const productResp = await window.fetch(productEndpoint)
    let productDetail = {}
    if (productResp.status === 200) {
      productDetail = productResp.json()
    }
    return {
      productId: productDetail.id,
      variants: productDetail.variants.map(variant => {
        return {
          id: variant.id,
          title: variant.title
        }
      })
    }
  }

  async function handleDetailPage (ctx) {
    let variantId = getValFromQuery('variant')
    let productDetail = { variants: [] }
    const productSlug = getSlugFromPath('products')
    if (productSlug) {
      productDetail = await getProductDetail(productSlug)
    }
    if (!variantId && productDetail.variants.length) {
      variantId = productDetail.variants[0].id
    }
    const payload = {
      product_group_ids: [ctx.resourceId]
    }
    if (variantId) {
      payload.product_ids = [variantId]
    }
    sendInteraction('product_detail_page_view', payload, ctx)
  }

  const pageHandler = {
    product: handleDetailPage
  }

  function main () {
    const ctx = setupEnv()
    if (!ctx) {
      return
    }
    const handler = pageHandler[ctx.pageType]
    if (handler) {
      handler(ctx)
    } else {
      reportWarning(`No handler in ${window.location}`)
    }
  }

  main()
})(window, document)
