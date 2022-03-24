import EventEmitter, { injectSubscribeMethods } from './emitter';

function getEventEmitter({ onError }) {
  // TODO: make singleton here
  const events = new EventEmitter({ onError });

  const history = window.history;

  const _pushState = history.pushState;
  history.pushState = function(state, _, url) {
    const result = _pushState.apply(this, arguments);
    events.emit('pushstate', { state, url });
    return result;
  };

  const _replaceState = history.replaceState;
  history.replaceState = function(state, _, url) {
    const result = _replaceState.apply(this, arguments);
    events.emit('replacestate', { state, url });
    return result;
  };

  window.addEventListener('popstate', ({ state }) => {
    events.emit('popstate', { state });
  }, false);

  window.addEventListener('hashchange', () => {
    events.emit('hashchange', {});
  }, false);

  return events;
}

export default class HistoryObserver {

  constructor({ onError }) {
    injectSubscribeMethods(this, getEventEmitter({ onError }));
  }

}
