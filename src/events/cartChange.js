import { listen } from './fetchListener'

let cartInfo;

async function fetchCartInfo() {
  const resp = await window.fetch('/cart.js');
  let cart = {};
  if (resp.status === 200) {
    cart = await resp.json();
  }
  return normalizeCartResp(cart);
}

// return {
//   token: <cart token>,
//   items: {
//     [<variant_id>]: { productId: <product ID>, quantity: <quantity> }
//   }
// }
function normalizeCartResp(resp) {
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
    return {items: {}};
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
      ret.items[id].quantity += Number.parseInt(item.quantity) || 0
    }
  })
  return ret
}

function handleCartAdd(tracker) {
  return async (resource, init, response) => {
    if (response.status !== 200) {
      return;
    }
    const body = await response.clone().json();

    const variantId = body.variant_id;
    const productId = body.product_id;

    const origQuantity = cartInfo.items[variantId] ? cartInfo.items[variantId].quantity : 0;
    const quantityAdded = body.quantity - origQuantity;

    if (quantityAdded <= 0) {
      return;
    }
    cartInfo = await fetchCartInfo();
    const cartToken = cartInfo.token;

    await tracker.sendInteraction('add_to_cart', {
      quantities: [quantityAdded],
      product_ids: [`${variantId}`],
      product_group_ids: [`${productId}`],
      context: {
        custom_context: {
          cart_token: cartToken
        }
      }
    });
  };
}

function handleCartChange(tracker) {
  return async (resource, init, response) => {
    if (response.status !== 200) {
      return; // TODO
    }
    const body = await response.clone().json();

    const newCartInfo = normalizeCartResp(body);
    const newItems = newCartInfo.items;
    const origItems = cartInfo.items;

    const itemAdded = [];
    const origItemMap = { ...cartInfo.items };

    Object.keys(newItems).forEach((id) => {
      if (!cartInfo.items[id]) {
        itemAdded.push({
          id,
          ...newItems[id]
        });
      } else {
        // TODO: handle quantity drop
        const quantityDiff = newItems[id].quantity - origItems[id].quantity;
        if (quantityDiff > 0) {
          itemAdded.push({
            id,
            productId: newItems[id].productId,
            quantity: quantityDiff
          });
        }
        delete origItemMap[id];
      }
    });

    cartInfo = newCartInfo;

    const context = {
      custom_context: {
        cart_token: newCartInfo.token
      }
    };

    if (itemAdded.length) {
      tracker.sendInteraction('add_to_cart', {
        quantities: itemAdded.map(i => i.quantity),
        product_ids: itemAdded.map(i => `${i.id}`),
        product_group_ids: itemAdded.map(i => `${i.productId}`),
        context
      });
    }

    const missingItems = Object.keys(origItemMap).map((id) => {
      return {
        id,
        ...origItemMap[id]
      }
    });
    if (missingItems.length) {
      tracker.sendInteraction('remove_from_cart', {
        product_ids: missingItems.map(i => `${i.id}`),
        product_group_ids: missingItems.map(i => `${i.productId}`),
        context
      });
    }
  };
}

// TODO: ad-hoc, improve later
let unlistenCartAdd, unlistenCartChange;

export function hook(window, tracker) {
  (async () => {
    cartInfo = await fetchCartInfo();
  })();
  unlistenCartAdd = listen({
    method: 'POST',
    path: s => s.startsWith('/cart/add')
  }, handleCartAdd(tracker));
  unlistenCartChange = listen({
    method: 'POST',
    path: s => s.startsWith('/cart/change')
  }, handleCartChange(tracker));
}

export function unhook() {
  if (unlistenCartAdd) {
    unlistenCartAdd();
    unlistenCartAdd = undefined;
  }
  if (unlistenCartChange) {
    unlistenCartChange();
    unlistenCartChange = undefined;
  }
}
