<img src="icons/icon128.png" width="64" alt="SuiteJump">

# SuiteJump

Universal search for NetSuite. A Chrome/Edge extension (Manifest V3) to find **any NetSuite record** by *internal ID*, *script ID*, *number* or *name*, see what type each match is, and open it directly.

## Usage

1. On a NetSuite tab (ideally an open record: transaction, customer, etc.), open the popup or press **Alt+Shift+F**.
2. Type an ID (`1234`), a script ID (`custbody_`, `customscript_`), a document number (`SO1001`) or part of a name.
3. Each result shows a tag with its type (*Field · Transaction Body*, *Script · User Event*, *Sales Order*, *Case*, *Record · My Custom Record*…). The chips at the top filter by group and show how many results each one has.
   - **Enter**: open the selected result · **↑ / ↓**: navigate
   - **Ctrl+Click / Ctrl+Enter / middle click**: open in the background
   - **Refresh button**: reload the definitions index (after creating fields, scripts, etc.)

## What it finds

**Definitions** (indexed once per account and stored in `chrome.storage.local`; search is instant):

| Type | SuiteQL table | Page |
|---|---|---|
| Custom fields (all types) | `customfield` | `bodycustfield.nl`, `columncustfield.nl`, `entitycustfield.nl`, `itemcustfield.nl`, `eventcustfield.nl`, `othercustfield.nl`, `itemoption.nl`, `itemnumbercustfield.nl`, `custreccustfield.nl` |
| Custom Record Types | `customrecordtype` | `custrecord.nl` |
| Custom Lists | `customlist` | `custlist.nl` |
| Scripts | `script` | `scripting/script.nl` |
| Script Deployments | `scriptdeployment` | `scripting/scriptrecord.nl` |
| Workflows | `workflow` | `workflow/setup/nwmanager.nl` |
| Saved searches | `savedsearch` | `search/search.nl` (+ link to results) |
| Roles, accounts, subsidiaries, departments, locations, classes | `role`, `account`, `subsidiary`, `department`, `location`, `classification` | setup / otherlists pages |

**Data records** (queried live as you type):

| Type | With a number (internal ID) | With text |
|---|---|---|
| Transactions (all) | `id` | exact `tranid` |
| Cases | `id` | case number or title |
| Customers, vendors, partners | `id` or entity number | entity number, company name, name, first + last name, email |
| Employees, contacts | `id` or entity number | entity number, first + last name, name, email |
| Other entities (projects, other names…) | `id` or entity number | entity number, name |
| Items | `id` | `itemid` / display name |
| Files | `id` | name |
| Tasks, phone calls, events | `id` | — |
| Instances of **every** custom record | `id` | — |

Text searches return at most 10 results per type.

## Languages

The UI is available in **English, Spanish and Portuguese**. It starts in the browser language (or English if it is none of those) and can be changed from the popup dropdown; the choice is saved. NetSuite proper names (*Transaction Body*, *Custom Record Type*, *Workflow*…) look the same in every language.

- Popup text: [i18n.js](i18n.js). To add a language, add an entry to `LANGS` and another to `I18N`.
- Extension and keyboard shortcut descriptions: [_locales](_locales) (`es`, `en`, `pt_BR`).

## Speed

- **Preload**: when any NetSuite page opens, the service worker (`background.js`) builds that account's index in the background if it is missing or older than 12 h, so it is ready when you open the popup.
- **Parallel**: each definition type is queried separately and at the same time, requesting only the needed columns; result pages are also fetched in parallel.
- **Progressive**: if the index does not exist yet, the popup shows results as each type arrives.
- **No visible waits**: the refresh icon spins while there is work and never blocks the search. Refreshing runs in the background and the previous index stays usable.

## How it works

- `fetcher.js` is injected into the page (`world: MAIN`) and uses `N/query` (SuiteQL) with the signed-in user's permissions. No tokens or integrations required.
- If a table does not exist or your role has no access, it is skipped without stopping the rest (details in the popup console).
- `registry.js` defines each type's label, group and URL. If a URL does not open correctly in your account, fix it there.

## Logs and troubleshooting

- **NetSuite queries**: on the NetSuite tab, `F12` → *Console*, filter by `[SuiteJump]`. It shows where `N/query` was loaded from, how many rows each table returned and which queries failed.
- **Popup**: right-click inside the popup → *Inspect* → *Console*.
- **Extension errors**: `chrome://extensions` → the extension's *Errors* button.

## Limitations

- List pages (e.g. *Record Types*) and the dashboard do not load SuiteScript 2.0. In that case the extension opens a hidden iframe with a new NetSuite form (task, customer or sales order) only to get `N/query`; nothing is saved. If your role cannot open any of them, open any record and try again (the URLs are in `CANDIDATES`, in `fetcher.js`).
- Only what your role can see through SuiteQL appears.
- Searching an ID queries every custom record in the account in parallel; accounts with a very large number of custom records may take a moment.

## Publishing to the Chrome Web Store

1. Build the package (output: `dist/suitejump-<version>.zip`):
   ```bash
   powershell -ExecutionPolicy Bypass -File tools/package.ps1
   ```
2. Upload the ZIP in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Fill in the listing with the text in [store/listing.md](store/listing.md) and the images in [store](store) (screenshots, promo tile and 512 px icon).
4. Use [store/privacy-policy.md](store/privacy-policy.md) as the privacy policy, linked from its public URL in this repository.
5. For each new version, bump `version` in `manifest.json` and rebuild the ZIP.

The icons come from [icons/logo.svg](icons/logo.svg). To regenerate the PNGs:
```bash
powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1 -OutDir icons
```
