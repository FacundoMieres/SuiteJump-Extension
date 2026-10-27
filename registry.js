// Catálogo de tipos: etiqueta (clave de i18n.js o nombre de NetSuite), grupo
// (para los filtros) y URL del registro.
// Si alguna URL no coincide con tu cuenta, ajustala acá.

const GROUPS = [
  { id: 'all', label: 'group.all' },
  { id: 'field', label: 'group.field' },
  { id: 'script', label: 'group.script' },
  { id: 'custom', label: 'group.custom' },
  { id: 'transaction', label: 'group.transaction' },
  { id: 'case', label: 'group.case' },
  { id: 'entity', label: 'group.entity' },
  { id: 'item', label: 'group.item' },
  { id: 'setup', label: 'group.setup' },
  { id: 'other', label: 'group.other' }
];

const FIELD_PAGES = {
  BODY: { page: 'bodycustfield.nl', type: 'Transaction Body' },
  COLUMN: { page: 'columncustfield.nl', type: 'Transaction Column' },
  ENTITY: { page: 'entitycustfield.nl', type: 'Entity' },
  ITEM: { page: 'itemcustfield.nl', type: 'Item' },
  CRM: { page: 'eventcustfield.nl', type: 'CRM' },
  EVENT: { page: 'eventcustfield.nl', type: 'CRM' },
  OTHER: { page: 'othercustfield.nl', type: 'Other Record' },
  ITEMOPTION: { page: 'itemoption.nl', type: 'Item Option' },
  ITEMNUMBER: { page: 'itemnumbercustfield.nl', type: 'Item Number' },
  RECORD: { page: 'custreccustfield.nl', type: 'Custom Record' }
};

// Si fieldtype no viene o no es conocido, se deduce por el prefijo del script ID.
function inferFieldType(item) {
  const type = (item.fieldtype || '').toUpperCase();
  if (FIELD_PAGES[type]) return type;
  const sid = (item.scriptid || '').toLowerCase();
  if (sid.startsWith('custbody')) return 'BODY';
  if (sid.startsWith('custcol')) return 'COLUMN';
  if (sid.startsWith('custentity')) return 'ENTITY';
  if (sid.startsWith('custitemnumber')) return 'ITEMNUMBER';
  if (sid.startsWith('custitem')) return 'ITEM';
  if (sid.startsWith('custevent')) return 'CRM';
  if (sid.startsWith('custrecord')) return item.recordtype ? 'RECORD' : 'OTHER';
  return null;
}

const KINDS = {
  field: {
    group: 'field',
    link(o, it) {
      const type = inferFieldType(it);
      if (!type) return { url: `${o}/app/common/custom/bodycustfields.nl`, label: `${t('label.field')} · ${it.fieldtype || '?'}` };
      const def = FIELD_PAGES[type];
      if (type === 'RECORD' && it.recordtype) {
        return {
          url: `${o}/app/common/custom/${def.page}?id=${it.id}&rectype=${it.recordtype}`,
          label: `${t('label.field')} · ${def.type}`,
          extra: { url: `${o}/app/common/custom/custrecord.nl?id=${it.recordtype}`, label: t('extra.parent') }
        };
      }
      return { url: `${o}/app/common/custom/${def.page}?id=${it.id}`, label: `${t('label.field')} · ${def.type}` };
    }
  },
  recordtype: { group: 'custom', label: 'Custom Record Type', url: (o, it) => `${o}/app/common/custom/custrecord.nl?id=${it.id}` },
  list: { group: 'custom', label: 'Custom List', url: (o, it) => `${o}/app/common/custom/custlist.nl?id=${it.id}` },
  customrecord: {
    group: 'custom',
    link: (o, it) => ({
      url: `${o}/app/common/custom/custrecordentry.nl?rectype=${it.rectype}&id=${it.id}`,
      label: `${t('label.record')} · ${it.typename}`
    })
  },
  script: {
    group: 'script',
    link: (o, it) => ({ url: `${o}/app/common/scripting/script.nl?id=${it.id}`, label: it.typename ? `Script · ${it.typename}` : 'Script' })
  },
  deployment: { group: 'script', label: 'Script Deployment', url: (o, it) => `${o}/app/common/scripting/scriptrecord.nl?id=${it.id}` },
  workflow: { group: 'script', label: 'Workflow', url: (o, it) => `${o}/app/common/workflow/setup/nwmanager.nl?id=${it.id}` },
  savedsearch: {
    group: 'setup',
    link: (o, it) => ({
      url: `${o}/app/common/search/search.nl?id=${it.id}&e=T&cu=T`,
      label: t('label.savedsearch'),
      extra: { url: `${o}/app/common/search/searchresults.nl?searchid=${it.id}`, label: t('extra.results') }
    })
  },
  role: { group: 'setup', label: 'label.role', url: (o, it) => `${o}/app/setup/role.nl?id=${it.id}` },
  account: { group: 'setup', label: 'label.account', url: (o, it) => `${o}/app/accounting/account/account.nl?id=${it.id}` },
  subsidiary: { group: 'setup', label: 'label.subsidiary', url: (o, it) => `${o}/app/common/otherlists/subsidiarytype.nl?id=${it.id}` },
  department: { group: 'setup', label: 'label.department', url: (o, it) => `${o}/app/common/otherlists/departmenttype.nl?id=${it.id}` },
  location: { group: 'setup', label: 'label.location', url: (o, it) => `${o}/app/common/otherlists/locationtype.nl?id=${it.id}` },
  classification: { group: 'setup', label: 'label.class', url: (o, it) => `${o}/app/common/otherlists/classtype.nl?id=${it.id}` },

  // Registros de datos (búsqueda en vivo)
  transaction: {
    group: 'transaction',
    link: (o, it) => ({ url: `${o}/app/accounting/transactions/transaction.nl?id=${it.id}`, label: it.typename || t('label.transaction') })
  },
  supportcase: { group: 'case', label: 'label.case', url: (o, it) => `${o}/app/crm/support/supportcase.nl?id=${it.id}` },
  entity: {
    group: 'entity',
    link: (o, it) => ({ url: `${o}/app/common/entity/entity.nl?id=${it.id}`, label: it.typename || t('label.entity') })
  },
  item: {
    group: 'item',
    link: (o, it) => ({ url: `${o}/app/common/item/item.nl?id=${it.id}`, label: it.typename ? `Item · ${it.typename}` : 'Item' })
  },
  file: { group: 'other', label: 'label.file', url: (o, it) => `${o}/app/common/media/mediaitem.nl?id=${it.id}` },
  task: { group: 'other', label: 'label.task', url: (o, it) => `${o}/app/crm/calendar/task.nl?id=${it.id}` },
  phonecall: { group: 'other', label: 'label.call', url: (o, it) => `${o}/app/crm/calendar/call.nl?id=${it.id}` },
  calendarevent: { group: 'other', label: 'label.event', url: (o, it) => `${o}/app/crm/calendar/event.nl?id=${it.id}` }
};

// Devuelve { url, label, group, extra? } para cualquier ítem.
function buildLink(origin, item) {
  const def = KINDS[item.kind];
  if (!def) return { url: origin, label: item.kind, group: 'other' };
  const link = def.link ? def.link(origin, item) : { url: def.url(origin, item), label: t(def.label) };
  return { ...link, group: def.group };
}
