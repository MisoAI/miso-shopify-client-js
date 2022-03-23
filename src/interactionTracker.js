import logger from './logger'
import { getValFromQuery, getSlugFromPath } from './utils'

let window
export const API_ENDPOINT = 'https://api.askmiso.com/v1/'

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
      console.log(`[${type}] to ${this.endpoint}\n-----------------\n${body}`)
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
      let msg = `[${type}] get ${resp.status}`
      if (resp.body) {
        const body = await resp.text()
        msg += `, resp: ${body}`
      }
      logger.error(msg)
    }
  }

}
