// ============================================================================
// dataService.js — Data / Logic Layer (Subject)
// ============================================================================
//
// LAYER RULES (same as the tourism project):
//   1. NO DOM access. No document, no window, no querySelector.
//   2. All outside communication happens through events on the bus.
//   3. State is mutated ONLY inside this file.
//   4. The UI layer renders what this service emits — nothing else.
//
// ============================================================================
// EVENT CONTRACT
// ----------------------------------------------------------------------------
//
//   'data:loading'         payload: null
//   'data:loadFailed'      payload: { message }
//   'data:loaded'          payload: null
//
//   'today:ready'          payload: { isHoliday, occasion, message }
//   'next:ready'           payload: { occasion, date }  (or { message } if none)
//   'panel:ready'          payload: { panel, holidays }
//     panel is one of: 'this-month' | 'next-month' | 'all-year'
//   'list:ready'           payload: { list, items }
//     list is one of: 'occasions' | 'dates' | 'days'
//
// ============================================================================

const BASE_URL = 'http://localhost:4000';

export function createDataService(eventBus) {
  if (!eventBus || typeof eventBus.emit !== 'function') {
    throw new TypeError('createDataService requires an event bus.');
  }

  // -------------------------------------------------------------------------
  // Private state — sealed in closure, never exposed.
  // -------------------------------------------------------------------------
  const state = {
    status: 'idle',
    loaded: {},   // tracks which panels have already been fetched
  };

  // -------------------------------------------------------------------------
  // Private fetch helper — every call goes through here.
  // -------------------------------------------------------------------------
  async function apiFetch(path) {
    const res = await fetch(BASE_URL + path);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${path}`);
    }
    return res.json();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  // Load the two cards that are always visible (today + next holiday).
  async function loadAlwaysVisible() {
    state.status = 'loading';
    eventBus.emit('data:loading', null);

    try {
      const [todayData, nextData] = await Promise.all([
        apiFetch('/holidays/today'),
        apiFetch('/holidays/next'),
      ]);

      eventBus.emit('today:ready', {
        isHoliday: todayData.is_holiday,
        occasion:  todayData.occasion,
        message:   todayData.message,
      });

      if (nextData.next_holiday) {
        eventBus.emit('next:ready', {
          occasion: nextData.next_holiday.occasion,
          date:     `${nextData.next_holiday.day}, ${formatDate(nextData.next_holiday.date)}`,
        });
      } else {
        eventBus.emit('next:ready', {
          occasion: nextData.message || 'No more holidays this year',
          date:     '—',
        });
      }

      state.status = 'ready';
      eventBus.emit('data:loaded', null);
    } catch (err) {
      state.status = 'error';
      eventBus.emit('data:loadFailed', { message: err.message });
    }
  }

  // Load a specific panel on demand (lazy — only fetches once per panel).
  async function loadPanel(panel) {
    if (state.loaded[panel]) return;
    state.loaded[panel] = true;

    try {
      if (panel === 'this-month') {
        const data = await apiFetch('/holidays/month/current');
        eventBus.emit('panel:ready', { panel, holidays: data.holidays || [] });

      } else if (panel === 'next-month') {
        const data = await apiFetch('/holidays/month/next');
        eventBus.emit('panel:ready', { panel, holidays: data.holidays || [] });

      } else if (panel === 'all-year') {
        const data = await apiFetch('/holidays/year/2026');
        eventBus.emit('panel:ready', { panel, holidays: data.holidays || [] });

      } else if (panel === 'occasions') {
        const data = await apiFetch('/holidays/occasions');
        eventBus.emit('list:ready', { list: 'occasions', items: data.occasions || [] });

      } else if (panel === 'dates') {
        const data = await apiFetch('/holidays/dates');
        eventBus.emit('list:ready', { list: 'dates', items: data.dates || [] });

      } else if (panel === 'days') {
        const data = await apiFetch('/holidays/days');
        eventBus.emit('list:ready', { list: 'days', items: data.days || [] });
      }
    } catch (err) {
      eventBus.emit('data:loadFailed', { message: err.message });
    }
  }

  // -------------------------------------------------------------------------
  // Pure date formatter (no DOM — safe here)
  // -------------------------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-BZ', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  return Object.freeze({ loadAlwaysVisible, loadPanel });
}
