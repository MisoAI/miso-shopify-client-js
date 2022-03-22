import { deepFreeze } from './util';
import EventEmitter from './emitter';
import FetchObserver from './fetch';
import { cart as fetchCartInfo } from './api';

export default class CartObserver {

  constructor({ autoget = true, deduplicate = true, error } = {}) {
    this._options = { autoget, deduplicate };

    const events = new EventEmitter({ error });
    Object.assign(this, {
      _events: events,
      on: events.on.bind(events),
      any: events.any.bind(events),
      once: events.once.bind(events),
    });

    const fetchObserver = new FetchObserver();
    const options = {
      method: ['GET', 'POST'],
      test: ({ path }) => path.indexOf('/cart') > -1,
    };
    this._unsubscribeFetchObserver = fetchObserver.observe('response', options, this._handleFetchResponse.bind(this));

    if (this._options.autoget) {
      this.fetchCartInfo();
    }
  }

  get state() {
    return this._state;
  }

  async fetchCartInfo() {
    await fetchCartInfo();
  }

  destroy() {
    this._unsubscribeFetchObserver && this._unsubscribeFetchObserver();
  }

  _getActionType(path) {
    const i = path.indexOf('/cart');
    let j = path.lastIndexOf('.');
    if (j < 0) {
      j = path.length;
    }
    if (path.charAt(j - 1) === '/') {
      j--;
    }
    return j - i === 5 ? 'get' : path.substring(i + 6, j);
  }

  _isJsonResponse(path) {
    return path.endsWith('.js') || path.endsWith('.json');
  }

  async _handleFetchResponse({ path, response }) {
    const action = this._getActionType(path);
    const isJson = this._isJsonResponse(path);
    let body = undefined;
    if (isJson) {
      body = deepFreeze(await response.clone().json());
    }
  
    const data = {};
    if (body) {
      if (action === 'add') {
        data.response = body;
      } else {
        data.newState = body;
      }
    }
    if (this._state) {
      data.oldState = this._state;
    }
  
    // if no body, emit event for any action except for get action in dedupe mode
    // since there is no data to work on, we are done with it
    if (!body) {
      if (!this._options.deduplicate || action !== 'get') {
        this._events.emit(action, Object.freeze(data));
      }
      return;
    }
    // if action is get, body is not full cart info, so emit then done
    if (action === 'add') {
      this._events.emit(action, Object.freeze(data));
      if (this._options.autoget) {
        this.fetchCartInfo();
      }
      return;
    }
    // if this is the first cart info:
    if (!this._state) {
      this._events.emit(action, Object.freeze(data));
    } else {
      // if dedupe option is true, emit ony if cart is changed
      const difference = this._diffState(this._state, body);
      if (!this._options.deduplicate || difference.changed) {
        data.difference = difference;
        this._events.emit(action, Object.freeze(data));
      }
    }

    // update cart
    this._state = body;
  }

  _diffState(oldState, newState) {
    const diff = {
      items: this._diffStateItems(oldState, newState)
    };
    if (newState.token !== oldState.token) {
      diff.token = newState.token;
    }
    diff.changed = !!(diff.token || diff.items.length);
    return Object.freeze(diff);
  }

  _diffStateItems(oldState, newState) {
    const items = [];
    const map = {};
    for (let item of newState.items) {
      item = { ...item };
      items.push(item);
      map[item.key] = item;
    }
    for (let item of oldState.items) {
      const item0 = map[item.key];
      if (item0) {
        item0.quantity -= item.quantity;
      } else {
        item = { ...item, quantity: -item.quantity };
        items.push(item);
        map[item.key] = item;
      }
    }
    return Object.freeze(items.filter(item => item.quantity).map(Object.freeze));
  }

}
