// ============================================================================
// eventEmitter.js — Pub/Sub factory (Observer Pattern core)
// ============================================================================
//
// Same pattern used in the tourism project.
//
// API:
//   const bus = createEventEmitter();
//   bus.on('event:name', payload => { ... });    // subscribe
//   bus.off('event:name', handler);              // unsubscribe
//   bus.emit('event:name', payload);             // publish
// ============================================================================

export function createEventEmitter() {
  const listeners = Object.create(null);

  function on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError(
        `createEventEmitter.on: listener for "${eventName}" must be a function.`
      );
    }
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push(listener);
  }

  function off(eventName, listener) {
    const arr = listeners[eventName];
    if (!arr) return;
    listeners[eventName] = arr.filter((fn) => fn !== listener);
  }

  function emit(eventName, payload) {
    const arr = listeners[eventName];
    if (!arr || arr.length === 0) return;
    const snapshot = arr.slice();
    for (const listener of snapshot) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[eventEmitter] Listener for "${eventName}" threw:`, err);
      }
    }
  }

  return Object.freeze({ on, off, emit });
}
