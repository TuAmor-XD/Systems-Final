// ============================================================================
// ui.js — View Layer (Observer)
// ============================================================================
//
// LAYER RULES:
//   1. This is the ONLY file allowed to touch the DOM.
//   2. This file MUST NOT fetch data or filter/transform anything.
//      It only renders what the dataService emits.
//   3. Communicate with the service ONLY through its public methods.
//
// ============================================================================

export function createUI(eventBus, dataService, rootEl) {

  // -------------------------------------------------------------------------
  // DOM element cache — resolved on mount, using data-role attributes.
  // -------------------------------------------------------------------------
  const els = {
    todayIcon:     null,
    todayTitle:    null,
    todayMsg:      null,
    todayBadge:    null,
    nextOccasion:  null,
    nextDate:      null,
    tabs:          null,   // NodeList of all tab buttons
    panels:        null,   // NodeList of all panel sections
  };

  const subscriptions = [];

  // -------------------------------------------------------------------------
  // RENDERERS — each one receives a payload from the dataService event.
  // -------------------------------------------------------------------------

  function renderToday({ isHoliday, occasion, message }) {
    if (isHoliday) {
      els.todayIcon.textContent  = '🎉';
      els.todayTitle.textContent = occasion;
      els.todayMsg.textContent   = message;
      els.todayBadge.textContent = 'Holiday Today';
      els.todayBadge.className   = 'badge holiday';
    } else {
      els.todayIcon.textContent  = '💼';
      els.todayTitle.textContent = 'Not a holiday today';
      els.todayMsg.textContent   = message;
      els.todayBadge.textContent = 'Working Day';
      els.todayBadge.className   = 'badge workday';
    }
  }

  function renderNext({ occasion, date }) {
    els.nextOccasion.textContent = occasion;
    els.nextDate.textContent     = date;
  }

  // Render a grid of holiday cards into the target panel container.
  function renderHolidayGrid(panelRole, holidays) {
    const container = rootEl.querySelector(`[data-role="grid-${panelRole}"]`);
    if (!container) return;

    container.replaceChildren();

    // Update count badge
    const countEl = rootEl.querySelector(`[data-role="count-${panelRole}"]`);
    if (countEl) {
      countEl.textContent = holidays ? `${holidays.length} holiday${holidays.length !== 1 ? 'ies' : 'y'}` : '';
    }

    if (!holidays || holidays.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'empty-state';
      empty.textContent = 'No holidays this period.';
      container.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    holidays.forEach((h) => fragment.appendChild(buildHolidayCard(h)));
    container.appendChild(fragment);
  }

  // Build one holiday card element from a holiday object.
  function buildHolidayCard(holiday) {
    const card = document.createElement('div');
    card.className = 'holiday-card';

    // Parse date for display
    const d = new Date(holiday.date);
    const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayNum = d.getDate();

    const dateBlock = document.createElement('div');
    dateBlock.className = 'holiday-date-block';

    const monthEl = document.createElement('span');
    monthEl.className = 'month';
    monthEl.textContent = monthAbbr;

    const dayNumEl = document.createElement('span');
    dayNumEl.className = 'day-num';
    dayNumEl.textContent = dayNum;

    dateBlock.appendChild(monthEl);
    dateBlock.appendChild(dayNumEl);

    const info = document.createElement('div');
    info.className = 'holiday-info';

    const name = document.createElement('div');
    name.className = 'holiday-name';
    name.textContent = holiday.occasion;

    const weekday = document.createElement('div');
    weekday.className = 'holiday-weekday';
    weekday.textContent = `${holiday.day} · ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

    info.appendChild(name);
    info.appendChild(weekday);

    card.appendChild(dateBlock);
    card.appendChild(info);
    return card;
  }

  // Render a simple numbered list into the target list element.
  function renderSimpleList(listRole, items) {
    const list = rootEl.querySelector(`[data-role="list-${listRole}"]`);
    if (!list) return;

    list.replaceChildren();

    // Update count badge
    const countEl = rootEl.querySelector(`[data-role="count-${listRole}"]`);
    if (countEl) {
      countEl.textContent = items ? `${items.length} item${items.length !== 1 ? 's' : ''}` : '';
    }

    if (!items || items.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'empty-state';
      empty.textContent = 'Nothing found.';
      list.parentElement.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((text, i) => {
      const li = document.createElement('li');

      const index = document.createElement('span');
      index.className = 'list-index';
      index.textContent = i + 1;

      const textSpan = document.createElement('span');
      textSpan.textContent = text;

      li.appendChild(index);
      li.appendChild(textSpan);
      fragment.appendChild(li);
    });
    list.appendChild(fragment);
  }

  // -------------------------------------------------------------------------
  // DOM EVENT HANDLERS — user input → service method calls
  // -------------------------------------------------------------------------

  function onTabClick(domEvent) {
    const tab = domEvent.target.closest('[data-role="tab"]');
    if (!tab) return;

    const panelId = tab.dataset.panel;

    // Update active tab styling.
    els.tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    // Show the matching panel, hide the rest.
    els.panels.forEach((p) => {
      if (p.id === panelId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Ask the service to load this panel (no-op if already loaded).
    dataService.loadPanel(panelId);
  }

  // -------------------------------------------------------------------------
  // SUBSCRIPTION WIRING
  // -------------------------------------------------------------------------

  function subscribe(eventName, handler) {
    eventBus.on(eventName, handler);
    subscriptions.push({ eventName, handler });
  }

  function wireSubscriptions() {
    subscribe('today:ready', (payload) => {
      renderToday(payload);
    });

    subscribe('next:ready', (payload) => {
      renderNext(payload);
    });

    subscribe('panel:ready', ({ panel, holidays }) => {
      renderHolidayGrid(panel, holidays);
    });

    subscribe('list:ready', ({ list, items }) => {
      renderSimpleList(list, items);
    });
  }

  // -------------------------------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------------------------------

  function mount() {
    els.todayIcon    = rootEl.querySelector('[data-role="today-icon"]');
    els.todayTitle   = rootEl.querySelector('[data-role="today-title"]');
    els.todayMsg     = rootEl.querySelector('[data-role="today-msg"]');
    els.todayBadge   = rootEl.querySelector('[data-role="today-badge"]');
    els.nextOccasion = rootEl.querySelector('[data-role="next-occasion"]');
    els.nextDate     = rootEl.querySelector('[data-role="next-date"]');
    els.tabs         = rootEl.querySelectorAll('[data-role="tab"]');
    els.panels       = rootEl.querySelectorAll('[data-role="panel"]');

    // Single delegated listener on the tabs nav.
    const tabsNav = rootEl.querySelector('.nav-tabs');
    if (tabsNav) {
      tabsNav.addEventListener('click', onTabClick);
    }

    wireSubscriptions();
  }

  function unmount() {
    const tabsNav = rootEl.querySelector('.nav-tabs');
    if (tabsNav) {
      tabsNav.removeEventListener('click', onTabClick);
    }

    subscriptions.forEach(({ eventName, handler }) => {
      eventBus.off(eventName, handler);
    });
    subscriptions.length = 0;
  }

  return Object.freeze({ mount, unmount });
}
