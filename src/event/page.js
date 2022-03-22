import EventEmitter from './emitter';

export default class Page {

  constructor({ error } = {}) {
    const events = new EventEmitter({ error });
    Object.assign(this, {
      _events: events,
      on: events.on.bind(events),
      any: events.any.bind(events),
      once: events.once.bind(events),
    });
  }

  // TODO

}
