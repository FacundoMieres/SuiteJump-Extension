const MAX_RESULTS = 80;
const LIVE_DELAY_MS = 250;

const $q = document.getElementById('q');
const $results = document.getElementById('results');
const $status = document.getElementById('status');
const $account = document.getElementById('account');
const $filters = document.getElementById('filters');
const $lang = document.getElementById('lang');

let tab = null;
let origin = null;
let index = [];
let live = [];
let liveSeq = 0;
let liveTimer = null;
let current = [];
let active = 0;
let group = 'all';

let statusMsg = null;
function setStatus(key, vars = {}, isError = false) {
  statusMsg = key ? { key, vars, isError } : null;
  renderStatus();
}
function renderStatus() {
  $status.textContent = statusMsg ? t(statusMsg.key, statusMsg.vars) : '';
  $status.className = statusMsg && statusMsg.isError ? 'error' : '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function highlight(text, term) {
  const safe = escapeHtml(text);
  if (!term) return safe;
  const i = text.toLowerCase().indexOf(term);
  if (i < 0) return safe;
  return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + term.length)) + '</mark>' + escapeHtml(text.slice(i + term.length));
}

// Score: exact ID > exact script ID > starts with > contains.
function score(item, term) {
  const id = String(item.id);
  const sid = item.scriptid.toLowerCase();
  const name = item.name.toLowerCase();
  if (id === term) return 100;
  if (sid === term) return 90;
  if (name === term) return 80;
  if (sid.startsWith(term)) return 60;
  if (name.startsWith(term)) return 50;
  if (sid.includes(term)) return 40;
  if (name.includes(term)) return 30;
  // Live results are already filtered by NetSuite.
  return item.live ? 20 : 0;
}

function search(raw) {
  const term = raw.trim().toLowerCase();
  if (!term) return [];
  return index.concat(live)
    .map((item) => ({ item, link: buildLink(origin, item), s: score(item, term) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.link.label.localeCompare(b.link.label) || a.item.scriptid.localeCompare(b.item.scriptid));
}

function open(url, background) {
  chrome.tabs.create({ url, index: tab.index + 1, active: !background });
  if (!background) window.close();
}

function renderFilters(all) {
  const counts = { all: all.length };
  all.forEach((r) => { counts[r.link.group] = (counts[r.link.group] || 0) + 1; });
  $filters.innerHTML = '';
  GROUPS.forEach((g) => {
    if (g.id !== 'all' && !counts[g.id]) return;
    const b = document.createElement('button');
    b.className = 'chip' + (g.id === group ? ' on' : '');
    b.textContent = `${t(g.label)} ${counts[g.id] || 0}`;
    b.addEventListener('click', () => { group = g.id; render(); $q.focus(); });
    $filters.appendChild(b);
  });
}

function render() {
  const term = $q.value.trim().toLowerCase();
  const all = search($q.value);
  if (group !== 'all' && !all.some((r) => r.link.group === group)) group = 'all';
  renderFilters(term ? all : []);
  current = all.filter((r) => group === 'all' || r.link.group === group).slice(0, MAX_RESULTS);
  active = 0;
  $results.innerHTML = '';
  current.forEach(({ item, link }, i) => {
    const li = document.createElement('li');
    if (i === active) li.className = 'active';
    li.innerHTML = `
      <div class="row1">
        <span class="name">${highlight(item.name || item.scriptid || t('ui.noName'), term)}</span>
        <span class="tag g-${link.group}">${escapeHtml(link.label)}</span>
      </div>
      <div class="row2">${item.scriptid ? highlight(item.scriptid, term) + ' · ' : ''}ID ${highlight(String(item.id), term)}${
        link.extra ? `<a href="#" data-extra>${escapeHtml(link.extra.label)}</a>` : ''}</div>`;
    const handler = (e) => {
      e.preventDefault();
      const target = e.target.closest('[data-extra]') ? link.extra.url : link.url;
      open(target, e.ctrlKey || e.metaKey || e.button === 1);
    };
    li.addEventListener('click', handler);
    li.addEventListener('auxclick', handler);
    $results.appendChild(li);
  });
}

function moveActive(delta) {
  if (!current.length) return;
  const items = $results.children;
  items[active].classList.remove('active');
  active = (active + delta + current.length) % current.length;
  items[active].classList.add('active');
  items[active].scrollIntoView({ block: 'nearest' });
}

// Subtle loading indicator: the refresh icon spins while there is work.
let busy = 0;
const $refresh = document.getElementById('refresh');
function setBusy(delta) {
  busy = Math.max(0, busy + delta);
  $refresh.classList.toggle('busy', busy > 0);
}

function showError(error) {
  if (error === 'NO_REQUIRE') setStatus('err.noRequire', {}, true);
  else if (error) setStatus('err.generic', { msg: error }, true);
  else setStatus('err.generic', { msg: t('err.noResponse') }, true);
}

function updateCount() {
  $account.textContent = `${new URL(origin).hostname.split('.')[0]} · ${t('ui.definitions', { n: index.length })}`;
}

// First time on this account: build here and show results as they arrive.
async function buildHere() {
  setBusy(1);
  try {
    const result = await buildIndex(tab.id, origin, (items) => {
      index = items.slice();
      updateCount();
      render();
    });
    if (result.error && !index.length) showError(result.error);
  } catch (e) {
    if (!index.length) setStatus('err.exec', { msg: e.message }, true);
  } finally {
    setBusy(-1);
  }
}

// Refresh in the service worker: it continues even if the popup closes, and the
// current index stays usable meanwhile.
function refreshInBackground() {
  setBusy(1);
  chrome.runtime.sendMessage({ type: 'refresh', tabId: tab.id, url: tab.url }, () => {
    void chrome.runtime.lastError;
    setBusy(-1);
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  const change = origin && area === 'local' && changes[indexKey(origin)];
  if (!change || !change.newValue) return;
  index = change.newValue.items;
  updateCount();
  render();
});

// Queries data records in NetSuite; discards stale responses.
function scheduleLive() {
  clearTimeout(liveTimer);
  const term = $q.value.trim();
  live = [];
  if (!origin || !(/^\d+$/.test(term) || term.length >= 3)) return;
  liveTimer = setTimeout(async () => {
    const seq = ++liveSeq;
    const recordTypes = index.filter((i) => i.kind === 'recordtype').map(({ id, scriptid, name }) => ({ id, scriptid, name }));
    let result;
    setBusy(1);
    try {
      result = await runInTab(tab.id, nsLiveSearch, [term, recordTypes]);
    } catch (e) {
      if (seq === liveSeq) setStatus('err.exec', { msg: e.message }, true);
      return;
    } finally {
      setBusy(-1);
    }
    if (seq !== liveSeq) return;
    if (!result || result.error) {
      showError(result && result.error);
      return;
    }
    live = result.items;
    render();
    setStatus(current.length ? null : 'ui.noResults');
  }, LIVE_DELAY_MS);
}

$q.addEventListener('input', () => {
  liveSeq++;
  setStatus(null);
  scheduleLive();
  render();
});
$q.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
  else if (e.key === 'Enter' && current.length) {
    open(current[active].link.url, e.ctrlKey || e.metaKey);
  }
});
$refresh.addEventListener('click', () => {
  refreshInBackground();
  $q.focus();
});

function renderLangs() {
  $lang.innerHTML = '';
  LANGS.forEach((l) => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = l.id.toUpperCase();
    opt.title = l.label;
    opt.selected = l.id === LANG;
    $lang.appendChild(opt);
  });
}

$lang.addEventListener('change', async () => {
  await saveLang($lang.value);
  applyI18n();
  renderStatus();
  if (origin) updateCount();
  render();
  $q.focus();
});

(async function init() {
  await loadLang();
  renderLangs();
  applyI18n();
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !isNetSuiteUrl(tab.url)) {
    setStatus('ui.notNetSuite', {}, true);
    $q.disabled = true;
    return;
  }
  origin = new URL(tab.url).origin;
  const cached = await readIndex(origin);
  if (cached) {
    index = cached.items;
    updateCount();
    render();
    if (isStale(cached)) refreshInBackground();
  } else {
    buildHere();
  }
})();
