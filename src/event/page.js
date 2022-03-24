import { deepFreeze, tryGet } from './util';
import EventEmitter, { injectSubscribeMethods } from './emitter';
import HistoryObserver from './history';
import { parse as parseUrl } from './url';

export default class PageInfoObserver {

  constructor({ locationObserver, onError } = {}) {
    this._error = onError;
    this._locationObserver = locationObserver || new HistoryObserver({ onError });
    this._events = injectSubscribeMethods(this, new EventEmitter({ onError }));
    this._onLocationChange = this._onLocationChange.bind(this);
    this._meta = tryGet(() => window.ShopifyAnalytics.meta.page);
  }

  start() {
    if (this._unsubscribeLocationObserver) {
      return;
    }
    this._unsubscribeLocationObserver = this._locationObserver.any(this._onLocationChange);
    this._onLocationChange(); // get info for the first time
  }

  stop() {
    if (!this._unsubscribeLocationObserver) {
      return;
    }
    this._unsubscribeLocationObserver();
    delete this._unsubscribeLocationObserver;
  }

  get url() {
    return this._url;
  }

  get info() {
    return this._info;
  }

  _onLocationChange() {
    const url = window.location.href;
    if (this._url && this._url === url) {
      return;
    }
    const oldInfo = this._info;
    const newInfo = this._info = { url, ...parseUrl(url) };
    const data = { newInfo, meta: this._meta };
    if (this._info) {
      data.oldInfo = oldInfo;
    }
    this._events.emit('change', deepFreeze(data));
  }

}
