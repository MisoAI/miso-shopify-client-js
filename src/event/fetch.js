import EventEmitter from './emitter';

export default class FetchObserver {

  constructor() {
    const events = this._events = new EventEmitter();

    const _fetch = this._fetchBak = window.fetch;
    const _getPath = this._getPath.bind(this);
    window.fetch = async function(resource, init) {
      const path = _getPath(resource);
      const method = init && init.method || 'GET';
      const context = { resource, init, path, method };
      events.emit('request', context);
      const response = await _fetch.apply(this, arguments);
      events.emit('response', Object.assign({ response }, context));
      return response;
    };
  }

  observe(target, options, callback) {
    return this._events.on(target, this._wrapCallback(options, callback));
  }

  // helper //
  _asPredicate(options) {
    return (context) => {
      const { path, method } = context;
      if (typeof options.test === 'function' && !options.test(context)) {
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

  _getPath(resource) {
    // TODO: handle fetch Request object
    return resource;
  }

  _wrapCallback(options, callback) {
    const predicate = this._asPredicate(options);
    return (context) => predicate(context) && callback(context);
  }

}
