import logger from './logger'
import { getValFromQuery, getSlugFromPath } from './utils'

let window
const API_ENDPOINT = 'https://api.askmiso.com/v1/'

export default class InteractionTracker {
  constructor (theWindow, { customerId, anonymousId, pageType, resourceId, apiKey, isDryRun = true } = {}) {
    window = theWindow
    this.ctx = {
      customerId,
      anonymousId,
      pageType,
      resourceId,
      apiKey,
      isDryRun
    }
    this.endpoint = `${API_ENDPOINT}interactions?api_key=${window.encodeURIComponent(apiKey)}`

    this.pageHandler = {
      product: this.handleDetailPage
    }
  }

  registerPageHandler () {
    const handler = this.pageHandler[this.ctx.pageType]
    if (handler) {
      handler.call(this)
    } else {
      logger.warn(`No handler in ${window.location}`)
    }
  }

  async sendInteraction (type, payload) {
    payload = {
      data: [{
        ...payload,
        type,
        user_id: this.ctx.customerId,
        anonymous_id: this.ctx.anonymousId
      }]
    }

    const body = JSON.stringify(payload)
    if (this.ctx.isDryRun) {
      console.log(`[SEND INTERACTION] to ${this.endpoint} : ${type} - ${body}`)
      return
    }
    const resp = await window.fetch(this.endpoint, {
      body,
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      mode: 'cors'
    })
    if (resp.status !== 200) {
      logger.error(`Invalid "${type}" interaction response, payload: ${body}`)
    }
  }

  async getProductDetail (productSlug) {
    const productEndpoint = `//${window.location.host}/products/${productSlug}.js`
    const productResp = await window.fetch(productEndpoint)
    let productDetail = {}
    if (productResp.status === 200) {
      productDetail = await productResp.json()
    }
    return {
      productId: `${productDetail.id}`,
      variants: productDetail.variants.map(variant => {
        return {
          id: `${variant.id}`,
          title: variant.title
        }
      })
    }
  }

  async handleDetailPage () {
    let variantId = getValFromQuery('variant')
    let productDetail = { variants: [] }
    const productSlug = getSlugFromPath('products')
    if (productSlug) {
      productDetail = await this.getProductDetail(productSlug)
    }
    if (!variantId && productDetail.variants.length) {
      variantId = productDetail.variants[0].id
    }
    const payload = {
      product_group_ids: [productDetail.productId]
    }
    if (variantId) {
      payload.product_ids = [variantId]
    }
    this.sendInteraction('product_detail_page_view', payload)
  }
}
