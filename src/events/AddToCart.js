import logger from '../logger'
import { hookXHR, unhookXHR } from './xhrListener'

let xhrHookId = null

export async function hook (window, tracker) {
  let cartInfo = await getCartInfo()

  const handleCartAdd = async function () {
    let resp = null
    try {
      resp = JSON.parse(this.responseText)
    } catch (err) {
      logger.error(`Failed during listen to add_to_cart: ${err}`)
    }
    if (!resp) {
      return
    }
    const variantId = resp.variant_id
    const quantity = resp.quantity
    const productId = resp.product_id
    await genEvent(variantId, productId, quantity)
  }

  async function genEvent (variantId, productId, quantity) {
    const origVariantInCart = (cartInfo.items || []).find(item => item.variant_id === variantId)
    const origQuantity = origVariantInCart ? origVariantInCart.quantity : 0

    const quantityAdded = quantity - origQuantity

    if (quantityAdded <= 0) {
      return
    }

    cartInfo = await getCartInfo()
    const cartToken = cartInfo.token

    await tracker.sendInteraction('add_to_cart', {
      quantity: [quantityAdded],
      product_ids: [variantId],
      product_group_ids: [productId],
      context: {
        custom_context: {
          cart_token: cartToken
        }
      }
    })
  }

  async function getCartInfo () {
    const resp = await window.fetch('/cart.js')
    let cartDetail = {}
    if (resp.status === 200) {
      cartDetail = await resp.json()
    }
    return cartDetail
  }

  function matchTargetEndpoint (openArgs) {
    const HOST = window.location.host
    const TARGET_ENDPOINT = '/cart/add'
    if (openArgs.length < 2 || openArgs[0] !== 'POST') {
      return false
    }
    const url = openArgs[1]
    return url === TARGET_ENDPOINT || (url.startsWith(HOST) && url.endsWith(TARGET_ENDPOINT))
  }

  xhrHookId = hookXHR(matchTargetEndpoint, handleCartAdd)
}

hook.unhook = function () {
  if (xhrHookId) {
    unhookXHR(xhrHookId)
  }
}
