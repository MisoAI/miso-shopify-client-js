import CartObserver from './event/cart';
import Tracker from './interactionTracker'
import { genUuid, getConfigFromScript } from './utils'

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

(function init() {
  const apiKey = getConfigFromScript('api_key');
  const dryRun = getConfigFromScript('dry_run') === 'true';
  if (!apiKey && !dryRun) {
    throw new Error('Expected api_key or dry_run in script URL parameters');
  }

  const ctx = { apiKey, dryRun, ...setupEnv() };

  const tracker = new Tracker(window, ctx);
  tracker.register();

  const cart = new CartObserver();
  cart.any((_, data) => handleCartEvent(tracker, data));

})();
