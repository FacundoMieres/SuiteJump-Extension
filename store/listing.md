# Ficha para la Chrome Web Store

## Nombre
SuiteJump

## Descripción corta (máx. 132 caracteres)
Saltá a cualquier campo, script, custom record, transacción o caso de NetSuite por internal ID, script ID o nombre.

## Categoría
Herramientas para desarrolladores (Developer Tools)

## Idioma
Español

## Descripción completa

¿Tenés un internal ID y no sabés a qué corresponde? ¿Necesitás abrir la definición de un campo y la búsqueda global de NetSuite no la encuentra?

SuiteJump es un buscador universal para NetSuite. Escribí un ID, un script ID o un nombre y saltá directo al registro.

QUÉ ENCUENTRA
• Campos personalizados de todo tipo: body, column, entity, item, CRM, other, item option, item number y de custom record.
• Scripts, deployments y workflows.
• Custom record types, custom lists y las instancias de cada custom record.
• Búsquedas guardadas, roles, cuentas contables, subsidiarias, departamentos, ubicaciones y clases.
• Transacciones, casos, clientes, proveedores, empleados, contactos, items, archivos, tareas, llamadas y eventos.

UN ID, TODAS LAS COINCIDENCIAS
Si escribís 1234, SuiteJump te muestra todo lo que tenga ese internal ID y te dice qué es cada cosa: un campo, un script, una orden de venta, un caso, etc. Con los filtros te quedás solo con el tipo que te interesa.

RÁPIDO
• El índice se arma en segundo plano apenas abrís NetSuite.
• Las consultas se hacen en paralelo y la búsqueda es instantánea.
• Atajo de teclado: Alt+Shift+F. Enter abre el resultado y Ctrl+Enter lo abre en segundo plano.

SEGURO Y PRIVADO
• Usa tu sesión de NetSuite y los permisos de tu rol: solo ves lo que ya podés ver.
• No requiere tokens, integraciones ni instalar nada en la cuenta.
• No envía datos a ningún servidor externo. El índice se guarda solo en tu navegador.

SuiteJump es una herramienta independiente y no está afiliada a Oracle ni a NetSuite, ni cuenta con su respaldo. NetSuite es una marca registrada de Oracle.

## URL de la política de privacidad
https://github.com/FacuMieres13/SuiteJump-Extension/blob/main/store/privacy-policy.md

## Justificación de permisos (formulario "Privacy practices")

**Propósito único:** buscar registros de NetSuite por ID, script ID o nombre y abrirlos directamente.

| Permiso | Justificación |
|---|---|
| `scripting` | Ejecutar consultas SuiteQL (`N/query`) en la pestaña de NetSuite del usuario, con su sesión, para buscar registros. |
| `storage` | Guardar localmente el índice de definiciones de cada cuenta para que la búsqueda sea instantánea. |
| Host `https://*.netsuite.com/*` | La extensión solo funciona en NetSuite. Las cuentas usan subdominios propios (`<cuenta>.app.netsuite.com`). |

**Código remoto:** No. Todo el código está incluido en el paquete.

**Uso de datos:** la extensión no recopila ni transmite datos de usuario. Las consultas van directamente de la pestaña del usuario a su propia cuenta de NetSuite, y los resultados se guardan solo en `chrome.storage.local`.

## Recursos gráficos

| Recurso | Tamaño | Estado |
|---|---|---|
| Ícono de la tienda | 128×128 | `icons/icon128.png` |
| Ícono en alta resolución | 512×512 | `store/icon512.png` |
| Capturas de pantalla | 1280×800 | `store/screenshot-1-id.png`, `store/screenshot-2-campos.png` |
| Mosaico promocional pequeño | 440×280 | `store/promo-440x280.png` |
