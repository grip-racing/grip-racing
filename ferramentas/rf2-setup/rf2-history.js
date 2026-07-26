// =============================================
// rF2 SETUP HISTORY (versioning)
// =============================================
// Saves snapshots to localStorage whenever the user clicks "Salvar".
// The last saved snapshot becomes the diff baseline (instead of schema defaults).
// =============================================

const HISTORY_KEY  = 'rf2-setup-history';
const MAX_HISTORY  = 60;   // max entries before oldest are dropped

// =============================================
// STORAGE HELPERS
// =============================================
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function persistHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================
// SAVE
// =============================================
/**
 * Save the current setup state as a new history entry.
 * Sets savedValues so that future diffs compare against this snapshot.
 */
function saveSetup() {
  if (!currentSchema || !isInBuilder) return;

  const snapshot = deepClone(currentValues);
  const entry = {
    id:         Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name:       currentSetupName || uiStrings.newSetup,
    track:      currentTrackName || '',
    templateId: selectedTemplateId,
    values:     snapshot,
    savedAt:    new Date().toISOString(),
  };

  // Update in-memory baseline
  savedValues = snapshot;

  // Persist
  const history = loadHistory();
  history.unshift(entry);          // newest first
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  persistHistory(history);

  // Refresh diffs (they now show 0 changes since we just saved)
  initDiffBadges();

  // Flash the save button
  const btn = document.getElementById('btn-save');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = uiStrings.saved;
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('saved'); }, 2000);
  }
}

// =============================================
// HISTORY OVERLAY
// =============================================
function showHistory() {
  document.getElementById('history-overlay')?.remove();
  const allEntries = loadHistory();  // all cars

  // resolve display name for a templateId
  function tplName(id) {
    if (!currentToolId) return id;
    return getTemplateList(currentToolId).find(tp => tp.id === id)?.name || id;
  }

  // distinct template IDs present in history
  const seenIds = [...new Set(allEntries.map(e => e.templateId))];
  const multiCar = seenIds.length > 1;

  // default filter = current car if it has entries, else 'all'
  let activeFilter = (selectedTemplateId && allEntries.some(e => e.templateId === selectedTemplateId))
    ? selectedTemplateId : 'all';

  // --- filter chips (only when multiple cars) ---
  let filtersHtml = '';
  if (multiCar) {
    const chips = [
      `<button class="history-filter-chip ${activeFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="filterHistory('all')">${uiStrings.historyAll}</button>`,
      ...seenIds.map(id =>
        `<button class="history-filter-chip ${activeFilter === id ? 'active' : ''}" data-filter="${escapeHtml(id)}" onclick="filterHistory('${escapeHtml(id)}')">${escapeHtml(tplName(id))}</button>`
      )
    ].join('');
    filtersHtml = `<div class="history-filters" id="history-filters">${chips}</div>`;
  }

  // --- entries ---
  let entriesHtml = '';
  for (const entry of allEntries) {
    const visible = activeFilter === 'all' || entry.templateId === activeFilter;
    const canLoad = entry.templateId === selectedTemplateId;
    const date = new Date(entry.savedAt);
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const trackHtml = entry.track
      ? `<span class="history-track">📍 ${escapeHtml(entry.track)}</span>`
      : '';
    const carHtml = multiCar
      ? `<span class="history-entry-car">${escapeHtml(tplName(entry.templateId))}</span>`
      : '';
    const loadBtn = canLoad
      ? `<button class="btn-history-load" onclick="loadFromHistory('${entry.id}')">${uiStrings.historyLoad}</button>`
      : `<button class="btn-history-load btn-history-load-disabled" disabled title="${escapeHtml(tplName(entry.templateId))}">${uiStrings.historyLoad}</button>`;

    entriesHtml += `
      <div class="history-entry${visible ? '' : ' history-hidden'}" id="hist-${entry.id}" data-template="${escapeHtml(entry.templateId)}">
        <div class="history-entry-info">
          <span class="history-entry-name">${escapeHtml(entry.name)}</span>
          ${carHtml}
          ${trackHtml}
          <span class="history-entry-date">${dateStr}</span>
        </div>
        <div class="history-entry-actions">
          ${loadBtn}
          <button class="btn-history-delete" onclick="deleteFromHistory('${entry.id}')" title="${uiStrings.historyDelete}">✕</button>
        </div>
      </div>`;
  }

  // empty state
  entriesHtml += `<p class="history-empty history-filter-empty"${allEntries.length > 0 ? ' style="display:none"' : ''}>${uiStrings.historyEmpty}</p>`;

  // pinned default entry — visible when filter = current car or 'all'
  const defaultVisible = !multiCar || activeFilter === 'all' || activeFilter === selectedTemplateId;
  entriesHtml += `
    <div class="history-entry history-entry-default${defaultVisible ? '' : ' history-hidden'}" data-template="__default__">
      <div class="history-entry-info">
        <span class="history-entry-name">${uiStrings.historyDefaultName}</span>
        <span class="history-entry-date">${uiStrings.historyDefaultDesc}</span>
      </div>
      <div class="history-entry-actions">
        <button class="btn-history-load btn-history-load-default" onclick="loadDefaults()">${uiStrings.historyLoad}</button>
      </div>
    </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'history-overlay';
  overlay.className = 'history-overlay';
  overlay.innerHTML = `
    <div class="history-panel" role="dialog">
      <div class="history-header">
        <span class="history-title">${uiStrings.historyTitle}</span>
        <button class="history-close" onclick="hideHistory()">✕</button>
      </div>
      ${filtersHtml}
      <div class="history-body">${entriesHtml}</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) hideHistory(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
}

// =============================================
// FILTER HISTORY
// =============================================
function filterHistory(filterId) {
  document.querySelectorAll('.history-filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === filterId);
  });
  document.querySelectorAll('.history-entry').forEach(el => {
    const tpl = el.dataset.template;
    if (filterId === 'all') {
      el.classList.remove('history-hidden');
    } else if (tpl === '__default__') {
      // show default only when filtering by current car
      el.classList.toggle('history-hidden', filterId !== selectedTemplateId);
    } else {
      el.classList.toggle('history-hidden', tpl !== filterId);
    }
  });
  // update empty state
  const visibleCount = document.querySelectorAll(
    '.history-entry:not(.history-hidden):not(.history-entry-default)'
  ).length;
  const emptyEl = document.querySelector('.history-filter-empty');
  if (emptyEl) emptyEl.style.display = visibleCount === 0 ? '' : 'none';
}

function hideHistory() {
  const overlay = document.getElementById('history-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

// =============================================
// LOAD FROM HISTORY
// =============================================
function loadFromHistory(entryId) {
  const entries = loadHistory();
  const entry = entries.find(e => e.id === entryId);
  if (!entry || !currentSchema) return;

  // Restore values — apply to schema fields (graceful: missing fields keep default)
  const schema = currentSchema;
  currentValues = {};
  for (const [catKey, cat] of Object.entries(schema.categories)) {
    currentValues[catKey] = {};
    for (const [subKey, sub] of Object.entries(cat)) {
      currentValues[catKey][subKey] = {};
      for (const [fieldKey, field] of Object.entries(sub)) {
        const v = entry.values?.[catKey]?.[subKey]?.[fieldKey];
        if (field.sides === 'both') {
          const lv = (v && typeof v === 'object') ? v.left  : (v !== undefined ? Number(v) : field.default);
          const rv = (v && typeof v === 'object') ? v.right : (v !== undefined ? Number(v) : field.default);
          currentValues[catKey][subKey][fieldKey] = {
            left:  Math.min(field.max, Math.max(field.min, lv)),
            right: Math.min(field.max, Math.max(field.min, rv)),
          };
        } else {
          currentValues[catKey][subKey][fieldKey] = v !== undefined
            ? Math.min(field.max, Math.max(field.min, Number(v)))
            : field.default;
        }
      }
    }
  }

  // The loaded state IS the new baseline
  savedValues = deepClone(currentValues);

  currentSetupName = entry.name;
  currentTrackName = entry.track || '';
  activeCategory   = null;
  linkState        = {};
  activeTagFilter  = new Set();
  isInBuilder      = true;

  hideHistory();
  renderTool(schema);
}

// =============================================
// LOAD DEFAULTS
// =============================================
function loadDefaults() {
  if (!currentSchema) return;
  savedValues = null;  // diffs against schema defaults again
  initValues(currentSchema);
  activeCategory  = null;
  linkState       = {};
  activeTagFilter = new Set();
  isInBuilder     = true;
  hideHistory();
  renderTool(currentSchema);
}

// =============================================
// DELETE FROM HISTORY
// =============================================
function deleteFromHistory(entryId) {
  const entries = loadHistory().filter(e => e.id !== entryId);
  persistHistory(entries);
  const el = document.getElementById('hist-' + entryId);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.2s';
    setTimeout(() => {
      el.remove();
      // show empty state if no entries left
      const panel = document.querySelector('.history-body');
      if (panel && !panel.querySelector('.history-entry')) {
        panel.innerHTML = `<p class="history-empty">${uiStrings.historyEmpty}</p>`;
      }
    }, 220);
  }
}
