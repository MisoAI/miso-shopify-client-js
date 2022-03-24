import { removeArrayItem } from './util';

export function injectSubscribeMethods(obj, emitter) {
  Object.assign(obj, {
    on: emitter.on.bind(emitter),
    any: emitter.any.bind(emitter),
    once: emitter.once.bind(emitter),
  });
  return emitter;
}

export default class EventEmitter {

  constructor({ error } = {}) {
    this._error = error || (e => console.error(e));
    this._named = {};
    this._unnamed = [];
  }

  emit(name, data) {
    const event = { name, data };
    const callbacks = this._named[name];
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
    for (const callback of this._unnamed) {
      callback(event);
    }
  }

  on(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    return this._on(name, this._wrapCallback(callback));
  }

  any(callback) {
    this._checkCallback(callback);
    return this._on(undefined, this._wrapCallback(callback));
  }

  once(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    const wrappedCallback = this._wrapCallback(callback);
    const off = this._on(name, (data) => {
      off();
      wrappedCallback(data);
    });
    return off;
  }

  // helper //
  _checkName(name) {
    if (typeof name !== 'string') {
      throw new Error(`Event name should be a string: ${name}`);
    }
  }

  _checkCallback(callback) {
    if (typeof callback !== 'function') {
      throw new Error(`Event callback should be a function: ${callback}`);
    }
  }

  _wrapCallback(callback) {
    const self = this;
    return ({ name, data }) => {
      try {
        callback(data, { name });
      } catch(e) {
        const msg = name ? `Error in event callback of ${name}.` : `Error in unnamed event callback.`
        self._error(new Error(msg, { cause: e }));
      }
    };
  }

  _on(name, wrappedCallback) {
    const callbacks = name ? (this._named[name] || (this._named[name] = [])) : this._unnamed;
    callbacks.push(wrappedCallback);
    // return the corresponding unsubscribe function
    return () => this._off(name, wrappedCallback);
  }

  _off(name, wrappedCallback) {
    const callbacks = name ? this._named[name] : this._unnamed;
    callbacks && removeArrayItem(callbacks, wrappedCallback);
  }

}
