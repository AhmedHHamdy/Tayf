# Architecture

*[بالعربي](architecture.ar.md)*

Tayf is an Electron app with four layers. The rule that keeps it honest:
**a layer may only import from the layers below it.**

```
src/renderer/     the overlay UI — talks to nothing but window.tayf
      │
src/preload.js    the only bridge; every channel is listed here
      │
src/main/         Electron: window, tray, hotkeys, IPC wiring
      │
src/app/          Workspace: state, refresh loop, optimistic writes
      │
src/providers/    Jira Cloud. No Jira type crosses this line.
src/storage/      config, settings, cache, log — all under userData
```

## The layers

### `src/providers/jira/`

Everything that knows Jira exists. Split by concern:

| File | Responsibility |
|---|---|
| `client.js` | HTTP, auth header, error codes. The only place `fetch` is called. |
| `mappers.js` | Jira JSON → neutral shapes (`toWorkItem`, `toTransition`) and ADF ↔ plain text. |
| `issues.js` | Read/write work items and transitions. |
| `boards.js` | Boards, board filter requirements, which board an item appears on. |
| `metadata.js` | Projects, issue types, create-screen fields, assignable users. |
| `jql.js` | Pure JQL parsing. No network, no Jira client — fully unit tested. |
| `index.js` | `JiraProvider` — the façade the rest of the app talks to, plus per-session caches. |

**Nothing Jira-shaped leaves this directory.** No ADF documents, no `customfield_*`
raw payloads at the boundary, no Jira JSON. The rest of the app sees `WorkItem`,
`Transition`, `Board`. That is what makes a second provider a new directory rather
than a rewrite — see [ADR-0002](adr/0002-provider-abstraction.md).

`client.js` throws `JiraError` with a **machine-readable `code`** (`bad-credentials`,
`rate-limited`, `no-connection`, …), never a display string. Human text lives in
`src/strings.js` and is applied at the IPC boundary, so translating the app means
editing one file.

### `src/storage/`

Four small modules over `app.getPath('userData')`: `credentials`, `settings`,
`cache`, `log`. `paths.js` is the only place those filenames are written down.

Credentials fall back to a repo-root `config.json` when no user-data file exists —
convenient in development, and gitignored.

### `src/app/workspace.js`

The application service. Holds the state the UI renders, runs the refresh loop,
applies transitions optimistically and rolls them back on failure, and syncs which
boards each item appears on. It emits `change` and `failure`.

It knows about a provider, a cache and a log — **it does not import Electron.**
That is deliberate: the whole read/write cycle is testable without a window.

### `src/main/`

Electron wiring only. `index.js` builds the object graph and connects the pieces;
everything else is a single concern (`overlay-window`, `tray-menu`, `hotkeys`,
`autostart`, `relaunch`, `ipc`).

`platform/` holds everything that differs between operating systems — hotkey
defaults, focus restoration, window flags, tray icons. `platform/index.js` selects
the Windows, macOS, or Linux adapter explicitly.

Windows takes the icon and the name above a notification from whichever Start Menu
shortcut carries the app's AppUserModelID — not from the notification itself, which
is why no title says "Tayf". The installed app's shortcut supplies both. A dev run
cannot: Electron rewrites its own `Electron.lnk` with whatever id is set, on every
toast. So `npm start` runs under a second id, `com.tayf.overlay.dev`, and leaves that
shortcut to Electron — a dev toast says Electron, and the shipped app keeps its name.

### `src/renderer/`

Plain ES modules, no framework, no build step. Electron loads them over `file://`
directly.

Screens are objects with `{ name, enter, leave, render }` registered into
`navigation.js`. `chrome.js` owns the shared furniture (search bar, banners, footers)
and shows exactly one screen's elements at a time. `keyboard.js` dispatches keys to
the active screen.

The renderer never sees a Jira URL, a token, or a network call. It only calls
`window.tayf.*`.

## Data flow

```
hotkey ──▶ show window ──▶ paint from cache            (instant, always)
                       └─▶ refresh in background ──▶ update cache ──▶ repaint
```

- Refresh every 60 seconds, and again each time the overlay opens.
- Writes are optimistic: update the cache, paint, then call Jira. On failure the
  item snaps back and a red banner appears that does not auto-dismiss.
- Board membership costs one request per board, so it is re-synced only when the
  set of item keys changes, or after 10 minutes.

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`.
- The renderer has a strict CSP (`default-src 'none'; script-src 'self'`). This is
  why generated HTML uses classes rather than inline `style` attributes — inline
  styles are blocked by design.
- The API token is written to `userData/config.json` and never sent to the renderer.
  `credentials.readWithoutToken()` is what the settings screen receives.

## Known gaps

- **UI strings are still inline in the renderer.** `src/strings.js` covers the main
  process only. Full i18n means extracting the renderer strings the same way.
- **Custom date fields do not appear on the create form** — only when editing.
  The plumbing exists (`renderDateRows` accepts a `defaultToToday`); the create path
  simply never calls it. This matches the behaviour before the refactor.
- **Credentials are stored in plain JSON**, not the OS keychain.
