// Builds and caches the definitions index. Used by the popup and the service
// worker (background preload). Requires fetcher.js.

const INDEX_VERSION = 'v3';
const INDEX_STALE_MS = 12 * 60 * 60 * 1000;
// Most searched first, so they show up sooner.
const INDEX_KINDS = [
  'field', 'recordtype', 'list', 'script', 'deployment', 'workflow', 'savedsearch',
  'role', 'account', 'subsidiary', 'department', 'location', 'classification'
];

function indexKey(origin) {
  return `index:${INDEX_VERSION}:${origin}`;
}

function isNetSuiteUrl(url) {
  try {
    return /\.netsuite\.com$/.test(new URL(url).hostname);
  } catch (e) {
    return false;
  }
}

async function readIndex(origin) {
  return (await chrome.storage.local.get(indexKey(origin)))[indexKey(origin)] || null;
}

function isStale(cached) {
  return !cached || Date.now() - cached.at > INDEX_STALE_MS;
}

async function runInTab(tabId, func, args = []) {
  const target = { tabId };
  await chrome.scripting.executeScript({ target, world: 'MAIN', func: nsBridge });
  const [res] = await chrome.scripting.executeScript({ target, world: 'MAIN', func, args });
  return res.result;
}

// Requests every kind in parallel; onPartial receives the accumulated items as
// each kind arrives. Saves the full index when done.
async function buildIndex(tabId, origin, onPartial) {
  const items = [];
  const failed = [];
  let fatal = null;
  await Promise.all(INDEX_KINDS.map(async (kind) => {
    let res;
    try {
      res = await runInTab(tabId, nsFetchKind, [kind]);
    } catch (e) {
      fatal = e.message || String(e);
      return;
    }
    if (!res || res.error) {
      if (res && res.table) failed.push(`${kind}: ${res.error}`);
      else fatal = res ? res.error : 'no response';
      return;
    }
    items.push(...res.items);
    if (onPartial) onPartial(items);
  }));
  if (!items.length) return { error: fatal || failed.join(' | ') || 'No data' };
  await chrome.storage.local.set({ [indexKey(origin)]: { at: Date.now(), items } });
  if (failed.length) console.warn('Unavailable tables:', failed);
  return { items, failed };
}
