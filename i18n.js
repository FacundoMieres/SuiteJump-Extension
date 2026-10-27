// UI translations. NetSuite proper names (Transaction Body, Custom Record Type,
// Workflow, etc.) stay in English in every language, as in the NetSuite UI.

const LANGS = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' }
];

const I18N = {
  es: {
    'ui.placeholder': 'Internal ID, script ID, número o nombre…',
    'ui.refresh': 'Recargar índice desde NetSuite',
    'ui.language': 'Idioma',
    'ui.hint': 'Enter: abrir · ↑↓: navegar · Ctrl: 2º plano',
    'ui.noName': '(sin nombre)',
    'ui.definitions': '{n} definiciones',
    'ui.noResults': 'Sin resultados.',
    'ui.notNetSuite': 'Abrí el popup desde una pestaña de NetSuite.',
    'err.noRequire': 'No se pudo cargar SuiteScript (N/query) en esta pestaña. Abrí un registro (ej. una transacción) y reintentá. Detalle en la consola de la pestaña (F12), prefijo [SuiteJump].',
    'err.exec': 'No se pudo ejecutar en la pestaña: {msg}',
    'err.generic': 'Error: {msg}',
    'err.noResponse': 'sin respuesta',
    'group.all': 'Todo',
    'group.field': 'Campos',
    'group.script': 'Scripts',
    'group.custom': 'Custom records',
    'group.transaction': 'Transacciones',
    'group.case': 'Casos',
    'group.entity': 'Entidades',
    'group.item': 'Items',
    'group.setup': 'Configuración',
    'group.other': 'Otros',
    'label.field': 'Campo',
    'label.record': 'Registro',
    'label.savedsearch': 'Búsqueda guardada',
    'label.role': 'Rol',
    'label.account': 'Cuenta contable',
    'label.subsidiary': 'Subsidiaria',
    'label.department': 'Departamento',
    'label.location': 'Ubicación',
    'label.class': 'Clase',
    'label.transaction': 'Transacción',
    'label.case': 'Caso',
    'label.entity': 'Entidad',
    'label.customer': 'Cliente',
    'label.employee': 'Empleado',
    'label.vendor': 'Proveedor',
    'label.contact': 'Contacto',
    'label.partner': 'Partner',
    'label.file': 'Archivo',
    'label.task': 'Tarea',
    'label.call': 'Llamada',
    'label.event': 'Evento',
    'extra.parent': 'Ver registro padre',
    'extra.results': 'Ver resultados'
  },
  en: {
    'ui.placeholder': 'Internal ID, script ID, number or name…',
    'ui.refresh': 'Reload index from NetSuite',
    'ui.language': 'Language',
    'ui.hint': 'Enter: open · ↑↓: navigate · Ctrl: background',
    'ui.noName': '(no name)',
    'ui.definitions': '{n} definitions',
    'ui.noResults': 'No results.',
    'ui.notNetSuite': 'Open the popup from a NetSuite tab.',
    'err.noRequire': 'Could not load SuiteScript (N/query) in this tab. Open a record (e.g. a transaction) and try again. Details in the tab console (F12), prefix [SuiteJump].',
    'err.exec': 'Could not run in the tab: {msg}',
    'err.generic': 'Error: {msg}',
    'err.noResponse': 'no response',
    'group.all': 'All',
    'group.field': 'Fields',
    'group.script': 'Scripts',
    'group.custom': 'Custom records',
    'group.transaction': 'Transactions',
    'group.case': 'Cases',
    'group.entity': 'Entities',
    'group.item': 'Items',
    'group.setup': 'Setup',
    'group.other': 'Other',
    'label.field': 'Field',
    'label.record': 'Record',
    'label.savedsearch': 'Saved Search',
    'label.role': 'Role',
    'label.account': 'Account',
    'label.subsidiary': 'Subsidiary',
    'label.department': 'Department',
    'label.location': 'Location',
    'label.class': 'Class',
    'label.transaction': 'Transaction',
    'label.case': 'Case',
    'label.entity': 'Entity',
    'label.customer': 'Customer',
    'label.employee': 'Employee',
    'label.vendor': 'Vendor',
    'label.contact': 'Contact',
    'label.partner': 'Partner',
    'label.file': 'File',
    'label.task': 'Task',
    'label.call': 'Phone Call',
    'label.event': 'Event',
    'extra.parent': 'View parent record',
    'extra.results': 'View results'
  },
  pt: {
    'ui.placeholder': 'Internal ID, script ID, número ou nome…',
    'ui.refresh': 'Recarregar índice do NetSuite',
    'ui.language': 'Idioma',
    'ui.hint': 'Enter: abrir · ↑↓: navegar · Ctrl: 2º plano',
    'ui.noName': '(sem nome)',
    'ui.definitions': '{n} definições',
    'ui.noResults': 'Nenhum resultado.',
    'ui.notNetSuite': 'Abra o popup a partir de uma aba do NetSuite.',
    'err.noRequire': 'Não foi possível carregar o SuiteScript (N/query) nesta aba. Abra um registro (ex.: uma transação) e tente novamente. Detalhes no console da aba (F12), prefixo [SuiteJump].',
    'err.exec': 'Não foi possível executar na aba: {msg}',
    'err.generic': 'Erro: {msg}',
    'err.noResponse': 'sem resposta',
    'group.all': 'Tudo',
    'group.field': 'Campos',
    'group.script': 'Scripts',
    'group.custom': 'Custom records',
    'group.transaction': 'Transações',
    'group.case': 'Casos',
    'group.entity': 'Entidades',
    'group.item': 'Itens',
    'group.setup': 'Configuração',
    'group.other': 'Outros',
    'label.field': 'Campo',
    'label.record': 'Registro',
    'label.savedsearch': 'Pesquisa salva',
    'label.role': 'Função',
    'label.account': 'Conta contábil',
    'label.subsidiary': 'Subsidiária',
    'label.department': 'Departamento',
    'label.location': 'Localização',
    'label.class': 'Classe',
    'label.transaction': 'Transação',
    'label.case': 'Caso',
    'label.entity': 'Entidade',
    'label.customer': 'Cliente',
    'label.employee': 'Funcionário',
    'label.vendor': 'Fornecedor',
    'label.contact': 'Contato',
    'label.partner': 'Parceiro',
    'label.file': 'Arquivo',
    'label.task': 'Tarefa',
    'label.call': 'Ligação',
    'label.event': 'Evento',
    'extra.parent': 'Ver registro pai',
    'extra.results': 'Ver resultados'
  }
};

// Initial language: the browser's if supported; otherwise English.
function detectLang() {
  let ui = 'en';
  try { ui = chrome.i18n.getUILanguage(); } catch (e) { ui = navigator.language || 'en'; }
  const code = ui.slice(0, 2).toLowerCase();
  return I18N[code] ? code : 'en';
}

let LANG = detectLang();

function t(key, vars = {}) {
  const text = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

async function loadLang() {
  try {
    const { lang } = await chrome.storage.local.get('lang');
    if (I18N[lang]) LANG = lang;
  } catch (e) { /* keep the browser language */ }
  return LANG;
}

async function saveLang(lang) {
  if (!I18N[lang]) return;
  LANG = lang;
  try { await chrome.storage.local.set({ lang }); } catch (e) { /* only lasts for this session */ }
}

// Static HTML text: data-i18n (text), data-i18n-placeholder, data-i18n-title.
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}
