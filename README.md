<img src="icons/icon128.png" width="64" alt="SuiteJump">

# SuiteJump

Buscador universal para NetSuite. Extensión de Chrome/Edge (Manifest V3) para buscar **cualquier registro de NetSuite** por *internal ID*, *script ID*, *número* o *nombre*, ver de qué tipo es cada coincidencia y abrirla directamente.

## Uso

1. Estando en una pestaña de NetSuite (idealmente un registro abierto: transacción, cliente, etc.), abrí el popup o usá **Alt+Shift+F**.
2. Escribí un ID (`1234`), un script ID (`custbody_`, `customscript_`), un número de documento (`SO1001`) o parte de un nombre.
3. Cada resultado muestra una etiqueta con su tipo (*Campo · Transaction Body*, *Script · User Event*, *Sales Order*, *Caso*, *Registro · Mi Custom Record*…). Los chips de arriba filtran por grupo y muestran cuántos hay de cada uno.
   - **Enter**: abre el resultado seleccionado · **↑ / ↓**: navegar
   - **Ctrl+Click / Ctrl+Enter / click del medio**: abrir en segundo plano
   - **⟳**: recargar el índice de definiciones (después de crear campos, scripts, etc.)

## Qué busca

**Definiciones** (se indexan una vez por cuenta y se guardan en `chrome.storage.local`; la búsqueda es instantánea):

| Tipo | Tabla SuiteQL | Página |
|---|---|---|
| Campos personalizados (todos los tipos) | `customfield` | `bodycustfield.nl`, `columncustfield.nl`, `entitycustfield.nl`, `itemcustfield.nl`, `eventcustfield.nl`, `othercustfield.nl`, `itemoption.nl`, `itemnumbercustfield.nl`, `custreccustfield.nl` |
| Custom Record Types | `customrecordtype` | `custrecord.nl` |
| Custom Lists | `customlist` | `custlist.nl` |
| Scripts | `script` | `scripting/script.nl` |
| Script Deployments | `scriptdeployment` | `scripting/scriptrecord.nl` |
| Workflows | `workflow` | `workflow/setup/nwmanager.nl` |
| Búsquedas guardadas | `savedsearch` | `search/search.nl` (+ link a resultados) |
| Roles, cuentas, subsidiarias, departamentos, ubicaciones, clases | `role`, `account`, `subsidiary`, `department`, `location`, `classification` | páginas de setup / otherlists |

**Registros de datos** (se consultan en vivo mientras escribís):

| Tipo | Con un número (internal ID) | Con texto |
|---|---|---|
| Transacciones (todas) | `id` | `tranid` exacto |
| Casos | `id` | número de caso o título |
| Entidades (clientes, proveedores, empleados, contactos…) | `id` | `entityid` |
| Items | `id` | `itemid` / nombre para mostrar |
| Archivos | `id` | nombre |
| Tareas, llamadas, eventos | `id` | — |
| Instancias de **cada** custom record | `id` | — |

Las búsquedas por texto devuelven como máximo 10 resultados por tipo.

## Idiomas

La interfaz está en **español, inglés y portugués**. Arranca en el idioma del navegador (o en inglés si no es ninguno de esos) y se cambia con el desplegable del popup; la elección queda guardada. Los nombres propios de NetSuite (*Transaction Body*, *Custom Record Type*, *Workflow*…) se muestran igual en todos los idiomas.

- Textos del popup: [i18n.js](i18n.js). Para agregar un idioma, sumá una entrada en `LANGS` y otra en `I18N`.
- Descripción de la extensión y del atajo de teclado: [_locales](_locales) (`es`, `en`, `pt_BR`).

## Velocidad

- **Precarga**: al abrir cualquier página de NetSuite, el service worker (`background.js`) arma el índice de esa cuenta en segundo plano si no existe o tiene más de 12 h. Cuando abrís el popup ya está listo.
- **En paralelo**: cada tipo de definición se consulta por separado y al mismo tiempo, pidiendo solo las columnas necesarias; las páginas de resultados también se traen en paralelo.
- **Progresivo**: si el índice todavía no existe, el popup muestra resultados a medida que llega cada tipo.
- **Sin esperas visibles**: el botón ⟳ gira mientras hay trabajo; nunca bloquea la búsqueda. Con ⟳ se refresca en segundo plano y el índice anterior sigue usable.

## Cómo funciona

- `fetcher.js` se inyecta en la página (`world: MAIN`) y usa `N/query` (SuiteQL) con los permisos del usuario logueado. No requiere tokens ni integraciones.
- Si una tabla no existe o tu rol no tiene acceso, se omite sin cortar el resto (el detalle queda en la consola del popup).
- `registry.js` define la etiqueta, el grupo y la URL de cada tipo. Si alguna URL no abre bien en tu cuenta, se corrige ahí.

## Logs y diagnóstico

- **Consultas a NetSuite**: en la pestaña de NetSuite, `F12` → *Console*, filtrá por `[SuiteJump]`. Ahí se ve de dónde se cargó `N/query`, cuántas filas trajo cada tabla y qué consultas fallaron.
- **Popup**: click derecho dentro del popup → *Inspeccionar* → *Console*.
- **Errores de la extensión**: `chrome://extensions` → botón *Errores* de la extensión.

## Limitaciones

- Las páginas de lista (p. ej. *Tipos de registro*) y el dashboard no cargan SuiteScript 2.0. En ese caso la extensión abre un iframe oculto con un formulario nuevo de NetSuite (tarea, cliente u orden de venta) solo para obtener `N/query`; no se guarda nada. Si tu rol no puede abrir ninguno, abrí cualquier registro y reintentá (las URLs están en `CANDIDATES`, en `fetcher.js`).
- Solo aparece lo que tu rol puede ver por SuiteQL.
- Buscar un ID consulta todos los custom records de la cuenta en paralelo; en cuentas con muchísimos custom records puede tardar un poco.

## Publicar en la Chrome Web Store

1. Generá el paquete (queda en `dist/suitejump-<versión>.zip`):
   ```bash
   powershell -ExecutionPolicy Bypass -File tools/package.ps1
   ```
2. Creá una cuenta de desarrollador en el [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (pago único de USD 5).
3. Subí el ZIP y completá la ficha con los textos de [store/listing.md](store/listing.md).
4. Publicá [store/privacy-policy.md](store/privacy-policy.md) en una URL pública (p. ej. GitHub Pages o un Gist) y pegá el link en la ficha. Antes, completá el email de contacto.
5. Subí al menos una captura de 1280×800 de una cuenta real, sin datos sensibles.
6. Para cada versión nueva, subí el número de `version` en `manifest.json` y volvé a generar el ZIP.

Los íconos salen de [icons/logo.svg](icons/logo.svg). Para regenerar los PNG:
```bash
powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1 -OutDir icons
```
