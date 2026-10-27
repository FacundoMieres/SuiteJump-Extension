// Preload: when a NetSuite page opens and that account's index is missing or
// stale, it is built in the background so the popup opens instantly.
importScripts('fetcher.js', 'indexer.js');

const inflight = new Set();

async function prewarm(tabId, url, force = false) {
  if (!isNetSuiteUrl(url)) return;
  const { origin, hostname, pathname } = new URL(url);
  // Only pages of a signed-in account (not the login page or system.netsuite.com).
  if (!/\.app\.netsuite\.com$/.test(hostname) || !pathname.startsWith('/app/') || pathname.startsWith('/app/login')) return;
  if (inflight.has(origin)) return;
  if (!force && !isStale(await readIndex(origin))) return;
  inflight.add(origin);
  try {
    await buildIndex(tabId, origin);
  } catch (e) {
    console.warn('Preload failed', origin, e);
  } finally {
    inflight.delete(origin);
  }
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.url) prewarm(tabId, tab.url);
});

// The popup requests refreshes here so the work continues even if it closes.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'refresh') {
    prewarm(msg.tabId, msg.url, true).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
