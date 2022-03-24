import CartObserver from './event/cart';
import PageInfoObserver from './event/page';
import { product as fetchProductInfo } from './event/api';

import { genUuid, getConfigFromScript } from './utils'
import Tracker from './interactionTracker'

(() => {
  // migrate to new session key
  const LEGACY_ANONYMOUS_SESSION_KEY = 'misoAnonymousKey';
  const ANONYMOUS_SESSION_KEY = 'miso-anonymous-id';
  const anonymousId = window.sessionStorage.getItem(LEGACY_ANONYMOUS_SESSION_KEY);
  anonymousId && window.sessionStorage.setItem(ANONYMOUS_SESSION_KEY, anonymousId);
})();

// TODO: plugin to override anonymousIdManager
// TODO: customer

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
    throw new Error('Cannot find ShopifyAnalytics');
  }
  const pageMeta = window.ShopifyAnalytics.meta.page || {}
  const { pageType = '_unknown', resourceId } = pageMeta
  const { customerId, anonymousId } = getUserId()

  return {
    pageType,
    resourceId,
    customerId,
    anonymousId,
  }
}

function handleCartEvent(tracker, data) {
  if (!data.difference || !data.difference.items) {
    return;
  }
  const cart_token = data.newState && data.newState.token;
  const context = { custom_context: { cart_token } };

  for (const item of data.difference.items) {
    const quantity = item.quantity;
    const product_ids = [`${item.variant_id}`];
    const product_group_ids = [`${item.product_id}`];

    if (quantity > 0) {
      const quantities = [ item.quantity ];
      tracker.sendInteraction('add_to_cart', { product_ids, product_group_ids, quantities, context });
    } else if (quantity < 0) {
      tracker.sendInteraction('remove_from_cart', { product_ids, product_group_ids, context });
    }
  }
}

async function handlePageInfoChange(tracker, { newInfo: info }) {
  if (!info) {
    return;
  }
  try {
    switch (info.type) {
      case 'home':
        tracker.sendInteraction('home_page_view');
        break;
      case 'collection':
        tracker.sendInteraction('category_page_view', toCategoryPageViewPayload(info));
        break;
      case 'product':
        tracker.sendInteraction('product_detail_page_view', await toProductDetailPageViewPayload(info));
        break;
    }
  } catch(e) {
    // TODO: tracking here
  }
}

function toCategoryPageViewPayload(info) {
  if (!info.collectionHandle) {
    throw new Error(`Collection handle not found: ${JSON.stringify(info)}`);
  }
  return {
    category: [info.collectionHandle]
  };
}

const productInfoCache = {};

async function getProductInfo(handle) {
  return productInfoCache[handle] || (productInfoCache[handle] = await fetchProductInfo(handle));
}

async function toProductDetailPageViewPayload(info) {
  if (!info.productHandle) {
    throw new Error(`Product handle not found: ${JSON.stringify(info)}`);
  }
  let variantId = info.variantId;
  const productInfo = await getProductInfo(info.productHandle);
  if (!variantId && productInfo.variants && productInfo.variants.length) {
    variantId = `${productInfo.variants[0].id}`;
  }
  const productId = `${productInfo.id}`;

  const payload = {};
  if (productId) {
    payload.product_group_ids = [productId];
  }
  if (variantId) {
    payload.product_ids = [variantId];
  }
  return payload;
}

(function init() {
  const apiKey = getConfigFromScript('api_key');
  const dryRun = getConfigFromScript('dry_run') === 'true';
  if (!apiKey && !dryRun) {
    throw new Error('Expected api_key or dry_run in script URL parameters');
  }

  const ctx = { apiKey, dryRun, ...setupEnv() };
  const tracker = new Tracker(window, ctx);

  const cartObserver = new CartObserver();
  cartObserver.any((data) => handleCartEvent(tracker, data));
  cartObserver.start();

  const pageInfoObserver = new PageInfoObserver();
  pageInfoObserver.on('change', (data) => handlePageInfoChange(tracker, data));
  pageInfoObserver.start();
})();
