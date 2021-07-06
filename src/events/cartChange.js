import logger from '../logger'
import { hookXHR, unhookXHR } from './xhrListener'

let xhrAddHookId = null
let xhrChangeHookId = null

export async function hook (window, tracker) {
  let cartInfo = await getCartInfo()

  const handleCartChange = async function () {
    let resp = null
    try {
      resp = JSON.parse(this.responseText)
    } catch (err) {
      logger.error(`Failed during listen to add_to_cart: ${err}`)
    }
    if (!resp) {
      return
    }
    const newCartInfo = normalizeCartResp(resp)
    const newItems = newCartInfo.items
    const origItems = cartInfo.items

    const itemAdded = []
    const origItemMap = { ...cartInfo.items }

    Object.keys(newItems).forEach((id) => {
      if (!cartInfo.items[id]) {
        itemAdded.push({
          id,
          ...newItems[id]
        })
      } else {
        // TODO: handle quantity drop
        const quantityDiff = newItems[id].quantity - origItems[id].quantity
        if (quantityDiff > 0) {
          itemAdded.push({
            id,
            productId: newItems[id].productId,
            quantity: quantityDiff
          })
        }
        delete origItemMap[id]
      }
    })

    const context = {
      custom_context: {
        cart_token: newCartInfo.token
      }
    }

    if (itemAdded.length) {
      await tracker.sendInteraction('add_to_cart', {
        quantity: itemAdded.map(i => i.quantity),
        product_ids: itemAdded.map(i => i.id),
        product_group_ids: itemAdded.map(i => i.productId),
        context
      })
    }

    const missingItems = Object.keys(origItemMap).map((id) => {
      return {
        id,
        ...origItemMap[id]
      }
    })
    if (missingItems.length) {
      await tracker.sendInteraction('remove_from_cart', {
        product_ids: missingItems.map(i => i.id),
        product_group_ids: missingItems.map(i => i.productId),
        context
      })
    }

    cartInfo = newCartInfo
  }

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
    // TODO: support multiple items cart add
    // ref: https://shopify.dev/api/ajax/reference/cart#response
    const variantId = resp.variant_id
    const quantity = resp.quantity
    const productId = resp.product_id
    await genAddEvent(variantId, productId, quantity)
  }

  async function genAddEvent (variantId, productId, quantity) {
    const origQuantity = cartInfo.items[variantId] ? cartInfo.items[variantId].quantity : 0

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

  // return {
  //   token: <cart token>,
  //   items: {
  //     [<variant_id>]: { productId: <product ID>, quantity: <quantity> }
  //   }
  // }
  function normalizeCartResp (resp) {
    if (resp.variant_id && resp.quantity) {
      return {
        items: {
          [resp.variant_id]: {
            productId: resp.productId,
            quantity: resp.quantity
          }
        }
      }
    }
    if (!resp.items) {
      return { items: {} }
    }
    // ref: https://shopify.dev/api/ajax/reference/cart#response
    const ret = {
      token: resp.token,
      items: []
    }
    resp.items.forEach((item) => {
      const id = item.variant_id
      if (id && item.quantity) {
        if (!ret.items[id]) {
          ret.items[id] = {
            productId: item.product_id,
            quantity: 0
          }
        }
        ret.items[id].quantity += item.quantity
      }
    })
    return ret
  }

  async function getCartInfo () {
    const resp = await window.fetch('/cart.js')
    let cartDetail = {}
    if (resp.status === 200) {
      cartDetail = await resp.json()
    }
    return normalizeCartResp(cartDetail)
  }

  xhrAddHookId = hookXHR('/cart/add', handleCartAdd)
  xhrChangeHookId = hookXHR('/cart/change', handleCartChange)
}

hook.unhook = function () {
  if (xhrAddHookId) {
    unhookXHR(xhrAddHookId)
  }
  if (xhrChangeHookId) {
    unhookXHR(xhrChangeHookId)
  }
}
