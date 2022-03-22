import { removeArrayItem } from './util';

export default class EventEmitter {

  constructor({ error } = {}) {
    this._error = error || (e => console.error(e));
    this._named = {};
    this._unnamed = [];
  }

  emit(name) {
    const callbacks = this._named[name];
    const restArgs = Array.prototype.slice.call(arguments, 1);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(restArgs);
      }
    }
    const allArgs = Array.prototype.slice.call(arguments);
    for (const callback of this._unnamed) {
      callback(allArgs);
    }
  }

  on(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    return this._on(name, this._wrapCallback(name, callback));
  }

  any(callback) {
    this._checkCallback(callback);
    return this._on(undefined, this._wrapCallback(undefined, callback));
  }

  once(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    const wrappedCallback = this._wrapCallback(name, callback);
    const off = this._on(name, (args) => {
      off();
      wrappedCallback(args);
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

  _wrapCallback(name, callback) {
    const self = this;
    return (args) => {
      try {
        callback.apply(undefined, args);
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
