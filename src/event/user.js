import { tryGet } from './util';

export function getAnonymousUserToken() {
  return tryGet(() => window.ShopifyAnalytics.lib.user().traits().uniqToken) || undefined;
}

export function getCustomerId() {
  return tryGet(() => window.ShopifyAnalytics.meta.page.customerId) ||
    tryGet(() => window.meta.page.customerId) ||
    tryGet(() => window._st.cid) ||
    undefined;
}
