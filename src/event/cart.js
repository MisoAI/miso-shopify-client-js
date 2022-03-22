import { deepFreeze } from './util';
import EventEmitter from './emitter';
import FetchObserver from './fetch';
import { cart as fetchCartInfo } from './api';

export default class CartObserver {

  constructor({ autoget = true, deduplicate = true, error, fetchObserver } = {}) {
    // TODO: support listening to request side as well
    this._options = { autoget, deduplicate };

    const events = new EventEmitter({ error });
    Object.assign(this, {
      _events: events,
      on: events.on.bind(events),
      any: events.any.bind(events),
      once: events.once.bind(events),
    });

    fetchObserver = fetchObserver || new FetchObserver();
    const options = {
      method: ['GET', 'POST'],
      test: ({ path }) => path.indexOf('/cart') > -1,
    };
    this._unsubscribeFetchObserver = fetchObserver.observe('response', options, this._handleFetchResponse.bind(this));

    // if autoget is on, we want to trigger a fetch ASAP
    this._autoget();
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
  
    const data = {
      source: 'fetch',
      phase: 'response',
    };
    if (body) {
      if (action === 'add') {
        // if action is add, the response body is not a full cart state, so use a different prop name
        data.response = body;
      } else {
        data.newState = body;
      }
    }
    if (this._state) {
      data.oldState = this._state;
    }
  
    if (!body) {
      // if the action is non-trivial or dedupe is off, we shall emit regardlessly
      if (action !== 'get' || !this._options.deduplicate) {
        this._emit(action, data);
      }
      // if the action is non-trivial and autoget is on, we want to trigger a fetch
      if (action !== 'get') {
        this._autoget();
      }
      // there is no data to work on, so we are done here
      return;
    }
    // if action is add, the response body is not a full cart state
    if (action === 'add') {
      // since add is non-trivial, we shall emit
      this._emit(action, data);
      // if autoget is on, we want to trigger a fetch
      this._autoget();
      // there is no data to work on, so we are done here
      return;
    }
    if (!this._state) {
      // if this is the first cart state info, always emit
      this._emit(action, data);
    } else {
      // if dedupe option is true, emit ony if cart is changed
      const difference = this._diffState(this._state, body);
      if (!this._options.deduplicate || difference.changed) {
        data.difference = difference;
        this._emit(action, data);
      }
    }

    // update cart
    this._state = body;
  }

  _autoget() {
    if (this._options.autoget) {
      this.fetchCartInfo();
    }
  }

  _emit(action, data) {
    this._events.emit(action, Object.freeze(data));
  }

  _diffState(oldState, newState) {
    // consider state changed iff items are different or token has been updated
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
