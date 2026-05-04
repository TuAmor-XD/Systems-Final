// ============================================================================
// main.js — Composition root
// ============================================================================
//
// Wiring:
//     eventBus      ← dataService   (service publishes)
//     eventBus      ← ui            (ui subscribes)
//     ui            → dataService   (ui calls service methods on user input)
//
// Service and UI are decoupled — they only know about the bus.
// ============================================================================

import { createEventEmitter } from './eventEmitter.js';
import { createDataService }  from './dataService.js';
import { createUI }           from './ui.js';

const eventBus    = createEventEmitter();
const dataService = createDataService(eventBus);
const ui          = createUI(eventBus, dataService, document.body);

// Mount the UI (caches DOM elements, wires subscriptions).
ui.mount();

// Load the always-visible cards (today + next holiday),
// then lazy-load the default panel (this-month).
dataService.loadAlwaysVisible().then(() => {
  dataService.loadPanel('this-month');
});
