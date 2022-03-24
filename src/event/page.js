import { deepFreeze } from './util';
import EventEmitter, { injectSubscribeMethods } from './emitter';
import HistoryObserver from './location';
import { parse as parseUrl } from './url';

export default class PageInfoObserver {

  constructor({ errorHandler, locationObserver } = {}) {
    this._locationObserver = locationObserver || new HistoryObserver({ errorHandler });
    this._events = injectSubscribeMethods(this, new EventEmitter({ error: errorHandler }));
    this._onLocationChange = this._onLocationChange.bind(this);
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
    const newInfo = this._info = deepFreeze({ url, ...parseUrl(url) });
    const data = { newInfo };
    if (this._info) {
      data.oldInfo = oldInfo;
    }
    this._events.emit('change', data);
  }

}
