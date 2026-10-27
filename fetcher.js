// These functions are injected into the NetSuite page (world: MAIN) to use
// N/query with the user's session. Each one must be self-contained: it cannot
// use anything defined outside of it (except window.__suitejump, set up by nsBridge).

// Installs window.__suitejump.getQuery(): gets the N/query module from the page or,
// if the page does not load SuiteScript 2.0 (lists, dashboard, etc.), from a hidden
// iframe that opens a NetSuite page that does.
function nsBridge() {
  const VERSION = 3;
  if (window.__suitejump && window.__suitejump.version === VERSION) return;
  const log = (...a) => console.info('[SuiteJump]', ...a);
  const FRAME_ID = '__suitejump_frame';
  const CANDIDATES = [
    '/app/crm/calendar/task.nl',
    '/app/common/entity/custjob.nl',
    '/app/accounting/transactions/salesord.nl'
  ];

  // NetSuite may declare require as a lexical global (const/let): it exists in the
  // console but not as window.require, so it is resolved by name.
  // eslint-disable-next-line no-undef
  const pageRequire = () => (typeof require === 'function' ? require : window.require);
  const frameRequire = (win) => {
    try {
      const req = win.eval('typeof require === "function" ? require : undefined');
      if (typeof req === 'function') return req;
    } catch (e) { /* CSP without eval, or inaccessible frame */ }
    try { return win.require; } catch (e) { return undefined; }
  };

  const loadQuery = (req) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out loading N/query')), 15000);
    req(['N/query'], (q) => { clearTimeout(timer); resolve(q); }, (e) => { clearTimeout(timer); reject(e); });
  });

  const openFrame = (url) => new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;border:0;visibility:hidden';
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (!ok) frame.remove();
      resolve(ok ? frame : null);
    };
    frame.addEventListener('load', () => {
      // Wait until NetSuite's AMD loader is available.
      let tries = 0;
      const poll = setInterval(() => {
        if (typeof frameRequire(frame.contentWindow) === 'function') { clearInterval(poll); finish(true); }
        else if (++tries > 25) { clearInterval(poll); finish(false); }
      }, 200);
    });
    setTimeout(() => finish(false), 30000);
    frame.src = url;
    document.body.appendChild(frame);
  });

  let pending = null;
  window.__suitejump = {
    version: VERSION,
    log,
    getQuery() {
      if (pending) return pending;
      pending = (async () => {
        const req = pageRequire();
        if (typeof req === 'function') {
          try {
            const q = await loadQuery(req);
            log('N/query loaded from the current page');
            return q;
          } catch (e) {
            log('The page has require but N/query did not load:', e);
          }
        } else {
          log('The current page does not load SuiteScript 2.0; trying a hidden iframe');
        }
        const existing = document.getElementById(FRAME_ID);
        if (existing) existing.remove();
        for (const url of CANDIDATES) {
          log('Trying iframe:', url);
          const frame = await openFrame(url);
          if (!frame) { log('No SuiteScript in', url); continue; }
          try {
            const q = await loadQuery(frameRequire(frame.contentWindow));
            log('N/query loaded from iframe', url);
            return q;
          } catch (e) {
            log('N/query failed in', url, e);
            frame.remove();
          }
        }
        throw new Error('NO_REQUIRE');
      })();
      pending.catch(() => { pending = null; });
      return pending;
    }
  };
}

// Metadata index (cached). Fetches a single kind per call so the popup and the
// service worker can request them all in parallel and show results as they arrive.
async function nsFetchKind(kind) {
  let query;
  try {
    query = await window.__suitejump.getQuery();
  } catch (e) {
    return { error: e.message || String(e) };
  }
  const log = window.__suitejump.log;
  const lower = (r) => {
    const row = {};
    Object.keys(r).forEach((k) => { row[k.toLowerCase()] = r[k]; });
    return row;
  };
  // Async version: all pages are fetched in parallel.
  const runPaged = async (sql) => {
    const opts = { query: sql, pageSize: 1000 };
    const paged = query.runSuiteQLPaged.promise
      ? await query.runSuiteQLPaged.promise(opts)
      : query.runSuiteQLPaged(opts);
    const pages = await Promise.all(paged.pageRanges.map((range) => (paged.fetch.promise
      ? paged.fetch.promise({ index: range.index })
      : paged.fetch({ index: range.index }))));
    return pages.flatMap((p) => p.data.asMappedResults().map(lower));
  };
  // Tries each SQL variant until one works (columns vary by account). The first
  // ones request only the needed columns, which is faster.
  const runFirst = async (sqls) => {
    let lastError;
    for (const sql of sqls) {
      try { return await runPaged(sql); } catch (e) { lastError = e; }
    }
    throw lastError;
  };
  const id = (r) => r.id ?? r.internalid ?? r.primarykey;
  const name = (r) => r.name || r.title || r.accountsearchdisplayname || r.fullname || r.acctname || '';
  const basic = (table) => [
    `SELECT internalid AS id, scriptid, name FROM ${table}`,
    `SELECT id, scriptid, name FROM ${table}`,
    `SELECT * FROM ${table}`
  ];
  const named = (table) => [`SELECT id, name FROM ${table}`, `SELECT * FROM ${table}`];

  const sources = {
    field: { sql: [
      'SELECT internalid AS id, scriptid, name, fieldtype, recordtype FROM customfield',
      'SELECT id, scriptid, name, fieldtype, recordtype FROM customfield',
      'SELECT * FROM customfield'],
    map: (r) => ({ fieldtype: r.fieldtype || '', recordtype: r.recordtype || null }),
    // Script parameters (custscript_*) live in customfield too; scripts and
    // deployments are enough, so they are left out.
    keep: (r) => String(r.fieldtype || '').toUpperCase() !== 'SCRIPT'
      && !String(r.scriptid || '').toLowerCase().startsWith('custscript') },
    recordtype: { sql: basic('customrecordtype') },
    list: { sql: basic('customlist') },
    script: { sql: ['SELECT id, scriptid, name, BUILTIN.DF(scripttype) AS typename FROM script', 'SELECT * FROM script'],
      map: (r) => ({ typename: r.typename || r.scripttype || '' }) },
    deployment: { sql: ['SELECT primarykey AS id, scriptid, title AS name FROM scriptdeployment', 'SELECT * FROM scriptdeployment'] },
    workflow: { sql: ['SELECT * FROM workflow'] },
    savedsearch: { sql: ['SELECT * FROM savedsearch'] },
    role: { sql: basic('role') },
    account: { sql: ['SELECT id, acctnumber AS scriptid, accountsearchdisplayname AS name FROM account', 'SELECT * FROM account'],
      map: (r) => ({ scriptid: r.scriptid || r.acctnumber || '' }) },
    subsidiary: { sql: named('subsidiary') },
    department: { sql: named('department') },
    location: { sql: named('location') },
    classification: { sql: named('classification') }
  };

  const src = sources[kind];
  if (!src) return { error: `Unknown kind: ${kind}` };
  const started = Date.now();
  try {
    const rows = (await runFirst(src.sql)).filter(src.keep || (() => true));
    log(`${kind}: ${rows.length} rows in ${Date.now() - started} ms`);
    return {
      items: rows.map((r) => ({
        kind,
        id: id(r),
        scriptid: String(r.scriptid || ''),
        name: String(name(r)),
        ...(src.map ? src.map(r) : {})
      }))
    };
  } catch (e) {
    log(`${kind}: failed`, e);
    return { error: e.message || String(e), table: true };
  }
}

// Live search of data records (transactions, cases, entities, etc.). A number
// searches by internal ID across every kind, including instances of each custom
// record; text searches by number/name.
async function nsLiveSearch(term, customRecordTypes) {
  let query;
  try {
    query = await window.__suitejump.getQuery();
  } catch (e) {
    return { error: e.message || String(e) };
  }
  const log = window.__suitejump.log;
  const lower = (r) => {
    const row = {};
    Object.keys(r).forEach((k) => { row[k.toLowerCase()] = r[k]; });
    return row;
  };
  const runFirst = async (sqls, params) => {
    let lastError;
    for (const sql of sqls) {
      try {
        const rs = await query.runSuiteQL.promise({ query: sql, params: typeof params === 'function' ? params(sql) : params });
        return rs.asMappedResults().map(lower);
      } catch (e) { lastError = e; }
    }
    throw lastError;
  };

  const isId = /^\d+$/.test(term);
  const like = `%${term.toUpperCase()}%`;
  const LIMIT = 'ROWNUM <= 10';
  const specs = [];
  // Fills every '?' of a variant with the LIKE pattern.
  const likeAll = (sql) => Array((sql.match(/\?/g) || []).length).fill(like);
  // Entity type codes (entity.type) mapped to their own kind and page.
  const ENTITY_KINDS = { custjob: 'customer', customer: 'customer', employee: 'employee', vendor: 'vendor', contact: 'contact', partner: 'partner' };
  const company = 'companyname';
  const person = "firstname || ' ' || lastname";
  // Per-type text search: richest query first, simpler fallbacks if a column is missing.
  const entityText = (kind, table, nameCols, extraCols = '') => ({
    kind,
    params: likeAll,
    sql: [
      `SELECT id, entityid, ${nameCols.map((c, i) => `${c} AS n${i}`).join(', ')}, email${extraCols} FROM ${table} WHERE (UPPER(entityid) LIKE ? OR ${nameCols.map((c) => `UPPER(${c}) LIKE ?`).join(' OR ')} OR UPPER(email) LIKE ?) AND ${LIMIT}`,
      `SELECT id, entityid, ${nameCols.map((c, i) => `${c} AS n${i}`).join(', ')} FROM ${table} WHERE (UPPER(entityid) LIKE ? OR ${nameCols.map((c) => `UPPER(${c}) LIKE ?`).join(' OR ')}) AND ${LIMIT}`,
      `SELECT id, entityid FROM ${table} WHERE UPPER(entityid) LIKE ? AND ${LIMIT}`
    ]
  });

  if (isId) {
    const n = Number(term);
    specs.push(
      { kind: 'transaction', params: [n], sql: [
        'SELECT id, tranid, BUILTIN.DF(type) AS typename, trandate, BUILTIN.DF(entity) AS entityname FROM transaction WHERE id = ?',
        'SELECT id, tranid, type AS typename FROM transaction WHERE id = ?'] },
      { kind: 'supportcase', params: [n], sql: [
        'SELECT id, casenumber, title, BUILTIN.DF(company) AS company FROM supportcase WHERE id = ?',
        'SELECT * FROM supportcase WHERE id = ?'] },
      { kind: 'entity', params: [n, term], sql: [
        `SELECT id, entityid, altname AS n0, firstname || ' ' || lastname AS n1, type AS typecode, BUILTIN.DF(type) AS typename FROM entity WHERE (id = ? OR entityid = ?) AND ${LIMIT}`,
        `SELECT id, entityid, altname AS n0, type AS typecode, BUILTIN.DF(type) AS typename FROM entity WHERE (id = ? OR entityid = ?) AND ${LIMIT}`,
        `SELECT id, entityid, type AS typecode FROM entity WHERE (id = ? OR entityid = ?) AND ${LIMIT}`] },
      { kind: 'item', params: [n], sql: [
        'SELECT id, itemid, displayname, BUILTIN.DF(itemtype) AS typename FROM item WHERE id = ?',
        'SELECT * FROM item WHERE id = ?'] },
      { kind: 'file', params: [n], sql: ['SELECT id, name, BUILTIN.DF(folder) AS folder FROM file WHERE id = ?', 'SELECT * FROM file WHERE id = ?'] },
      { kind: 'task', params: [n], sql: ['SELECT id, title FROM task WHERE id = ?'] },
      { kind: 'phonecall', params: [n], sql: ['SELECT id, title FROM phonecall WHERE id = ?'] },
      { kind: 'calendarevent', params: [n], sql: ['SELECT id, title FROM calendarevent WHERE id = ?'] }
    );
    (customRecordTypes || []).forEach((rt) => {
      if (!/^customrecord[a-z0-9_]*$/i.test(rt.scriptid)) return;
      specs.push({
        kind: 'customrecord', params: [n], extra: { rectype: rt.id, typename: rt.name || rt.scriptid },
        sql: [`SELECT id, name FROM ${rt.scriptid} WHERE id = ?`, `SELECT id FROM ${rt.scriptid} WHERE id = ?`]
      });
    });
  } else {
    specs.push(
      { kind: 'transaction', params: [term.toUpperCase()], sql: [
        `SELECT id, tranid, BUILTIN.DF(type) AS typename, trandate, BUILTIN.DF(entity) AS entityname FROM transaction WHERE UPPER(tranid) = ? AND ${LIMIT}`] },
      { kind: 'supportcase', params: [term, like], sql: [
        `SELECT id, casenumber, title, BUILTIN.DF(company) AS company FROM supportcase WHERE (casenumber = ? OR UPPER(title) LIKE ?) AND ${LIMIT}`] },
      entityText('customer', 'customer', [company, 'altname', person]),
      entityText('vendor', 'vendor', [company, 'altname', person]),
      entityText('partner', 'partner', [company, 'altname', person]),
      entityText('employee', 'employee', [person, 'altname']),
      entityText('contact', 'contact', [person, 'altname'], ', BUILTIN.DF(company) AS company'),
      { kind: 'entity', params: likeAll, sql: [
        `SELECT id, entityid, altname AS n0, firstname || ' ' || lastname AS n1, type AS typecode, BUILTIN.DF(type) AS typename FROM entity WHERE (UPPER(entityid) LIKE ? OR UPPER(altname) LIKE ?) AND ${LIMIT}`,
        `SELECT id, entityid, altname AS n0, type AS typecode, BUILTIN.DF(type) AS typename FROM entity WHERE (UPPER(entityid) LIKE ? OR UPPER(altname) LIKE ?) AND ${LIMIT}`,
        `SELECT id, entityid, type AS typecode FROM entity WHERE UPPER(entityid) LIKE ? AND ${LIMIT}`] },
      { kind: 'item', params: [like, like], sql: [
        `SELECT id, itemid, displayname, BUILTIN.DF(itemtype) AS typename FROM item WHERE (UPPER(itemid) LIKE ? OR UPPER(displayname) LIKE ?) AND ${LIMIT}`] },
      { kind: 'file', params: [like], sql: [
        `SELECT id, name, BUILTIN.DF(folder) AS folder FROM file WHERE UPPER(name) LIKE ? AND ${LIMIT}`] }
    );
  }

  const describe = (kind, r) => {
    switch (kind) {
      case 'transaction': return { scriptid: r.tranid || '', name: [r.tranid, r.entityname, r.trandate].filter(Boolean).join(' · '), typename: r.typename || '' };
      case 'supportcase': return { scriptid: r.casenumber || '', name: [r.title, r.company].filter(Boolean).join(' · ') };
      case 'entity': case 'customer': case 'vendor': case 'partner': case 'employee': case 'contact': {
        const display = [r.n0, r.n1, r.n2].map((v) => String(v || '').trim()).find(Boolean) || r.entityid || '';
        return { scriptid: r.entityid || '', name: [display, r.company, r.email].filter(Boolean).join(' · '), typename: r.typename || '' };
      }
      case 'item': return { scriptid: r.itemid || '', name: r.displayname || r.itemid || '', typename: r.typename || '' };
      case 'file': return { scriptid: r.folder || '', name: r.name || '' };
      default: return { scriptid: '', name: r.name || r.title || '' };
    }
  };

  const results = await Promise.all(specs.map(async (spec) => {
    try {
      const rows = await runFirst(spec.sql, spec.params);
      return rows.map((r) => ({ kind: spec.kind, id: r.id, typecode: r.typecode, ...describe(spec.kind, r), ...(spec.extra || {}), live: true }));
    } catch (e) {
      log(`Live search ${spec.kind}${spec.extra ? ' ' + spec.extra.typename : ''}: failed`, e);
      return [];
    }
  }));
  const items = results.flat().map((it) => {
    if (it.kind !== 'entity') return it;
    const specific = ENTITY_KINDS[String(it.typecode || '').toLowerCase()];
    return specific ? { ...it, kind: specific } : it;
  });
  const seen = new Set();
  return {
    items: items.filter((it) => {
      const key = `${it.kind}:${it.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
  };
}
