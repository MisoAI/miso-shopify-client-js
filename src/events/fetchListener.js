const listeners = [];

export function listen(options, callback) {
  options = normalizeOptions(options);
  const entry = {options, callback};
  listeners.push(entry);
  // return unlisten function
  return () => {
    const i = listeners.findIndex((en) => en === entry);
    if (i > -1) {
      listeners.splice(i, 1);
    }
  };
}

function getPath(resource) {
  // TODO: handle fetch Request object
  return resource;
}

function normalizeOptions(options) {
  options = options || {};

  if (typeof options.match !== 'function') {
    options.match = (resource, init, response) => {
      const path = getPath(resource);
      if (options.path) {
        if (typeof options.path === 'string' && options.path !== path) {
          return false;
        }
        if (typeof options.path === 'function' && !options.path(path)) {
          return false;
        }
      }
      if (options.method && options.method !== init.method) {
        // TODO: handle capitalization, GET
        return false;
      }
      // TODO: more options
      return true;
    };
  }

  return options;
}

function emit(resource, init, response) {
  for (let entry of listeners) {
    try {
      if (entry.options.match(resource, init, response)) {
        entry.callback(resource, init, response);
      }
    } catch (e) {
      // TODO
    }
  }
  //console.log(resource, init, response);
}

const _fetch = window.fetch;
window.fetch = async function(resource, init) {
  const response = await _fetch.apply(this, arguments);
  emit(resource, init, response);
  return response;
};
