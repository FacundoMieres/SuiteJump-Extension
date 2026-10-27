// Precarga: cuando se abre una página de NetSuite y el índice de esa cuenta no
// existe o está viejo, se arma en segundo plano para que el popup abra al instante.
importScripts('fetcher.js', 'indexer.js');

const inflight = new Set();

async function prewarm(tabId, url, force = false) {
  if (!isNetSuiteUrl(url)) return;
  const { origin, hostname, pathname } = new URL(url);
  // Solo páginas de una cuenta con sesión iniciada (no login ni system.netsuite.com).
  if (!/\.app\.netsuite\.com$/.test(hostname) || !pathname.startsWith('/app/') || pathname.startsWith('/app/login')) return;
  if (inflight.has(origin)) return;
  if (!force && !isStale(await readIndex(origin))) return;
  inflight.add(origin);
  try {
    await buildIndex(tabId, origin);
  } catch (e) {
    console.warn('Precarga fallida', origin, e);
  } finally {
    inflight.delete(origin);
  }
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'complete' && tab.url) prewarm(tabId, tab.url);
});

// El popup pide refrescar acá para que el trabajo siga aunque se cierre.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'refresh') {
    prewarm(msg.tabId, msg.url, true).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
