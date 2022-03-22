import EventEmitter from './emitter';

function getPath(resource) {
  // TODO: handle fetch Request object
  return `${resource}`;
}

function getMethod(resource, init) {
  // TODO: handle fetch Request object
  return init && init.method || 'GET';
}

function getEventEmitter() {
  // TODO: make singleton here
  const events = new EventEmitter();
  const _fetch = window.fetch;
  window.fetch = async function(resource, init) {
    const path = getPath(resource);
    const method = getMethod(resource, init);
    const data = { resource, init, path, method };
    events.emit('request', data);
    const response = await _fetch.apply(this, arguments);
    events.emit('response', Object.assign({ response }, data));
    return response;
  };
  return events;
}

export default class FetchObserver {

  constructor() {
    // TODO: error handling
    this._events = getEventEmitter();
  }

  observe(target, options, callback) {
    return this._events.on(target, this._wrapCallback(options, callback));
  }

  // helper //
  _asPredicate(options) {
    return (data) => {
      const { path, method } = data;
      if (typeof options.test === 'function' && !options.test(data)) {
        return false;
      }
      if (options.path) {
        // TODO: support regex
        if (typeof options.path === 'string' && options.path !== path) {
          return false;
        }
      }
      if (options.method) {
        if (typeof options.method === 'string' && options.method !== method) {
          return false;
        }
        if (Array.isArray(options.method) && !options.method.some((m) => m.toUpperCase() === method)) {
          return false;
        }
      }
      return true;
    };
  }

  _wrapCallback(options, callback) {
    const predicate = this._asPredicate(options);
    return (data) => predicate(data) && callback(data);
  }

}
