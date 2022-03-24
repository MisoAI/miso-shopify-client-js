import EventEmitter, { injectSubscribeMethods } from './event/emitter';
import CartObserver from './event/cart';
import PageInfoObserver from './event/page';
import { product as fetchProductInfo } from './event/api';

export default class InteractionObserver {

  constructor({ cartObserver, pageInfoObserver, onError }) {
    this._error = onError;
    this._cartObserver = cartObserver || new CartObserver({ onError });
    this._pageInfoObserver = pageInfoObserver || new PageInfoObserver({ onError });
    this._events = injectSubscribeMethods(this, new EventEmitter({ onError }));
    this._productInfoCache = {};

    this._cartObserver.any(this._handleCartEvent.bind(this));
    this._pageInfoObserver.on('change', this._handlePageInfoChange.bind(this));
  }

  start() {
    this._cartObserver.start();
    this._pageInfoObserver.start();
  }

  _emit(type, payload = {}) {
    this._events.emit(type, { type, ...payload });
  }

  _handleCartEvent({ newState, difference }) {
    if (!difference || !difference.items) {
      return;
    }
    const cart_token = newState && newState.token;
    const context = { custom_context: { cart_token } };
  
    for (const item of difference.items) {
      const quantity = item.quantity;
      const product_ids = [`${item.variant_id}`];
      const product_group_ids = [`${item.product_id}`];
  
      if (quantity > 0) {
        const quantities = [ item.quantity ];
        this._emit('add_to_cart', { product_ids, product_group_ids, quantities, context });
      } else if (quantity < 0) {
        this._emit('remove_from_cart', { product_ids, product_group_ids, context });
      }
    }
  }

  async _handlePageInfoChange({ newInfo: info }) {
    if (!info) {
      return;
    }
    try {
      switch (info.type) {
        case 'home':
          this._emit('home_page_view');
          break;
        case 'collection':
          this._emit('category_page_view', this._toCategoryPageViewPayload(info));
          break;
        case 'product':
          this._emit('product_detail_page_view', await this._toProductDetailPageViewPayload(info));
          break;
      }
    } catch(e) {
      this._error && this._error(e);
    }
  }

  _toCategoryPageViewPayload(info) {
    if (!info.collectionHandle) {
      throw new Error(`Collection handle not found: ${JSON.stringify(info)}`);
    }
    return { category: [info.collectionHandle] };
  }

  async _toProductDetailPageViewPayload(info) {
    if (!info.productHandle) {
      throw new Error(`Product handle not found: ${JSON.stringify(info)}`);
    }
    let variantId = info.variantId;
    const productInfo = await this._getProductInfo(info.productHandle);
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
  
  async _getProductInfo(handle) {
    return this._productInfoCache[handle] || (this._productInfoCache[handle] = await fetchProductInfo(handle));
  }

}
