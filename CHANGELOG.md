# Changelog

Notable changes to Tayf. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
While Tayf is on 0.x, a minor bump is a feature and a patch is a fix.

## [Unreleased]

### Added

- **The tray says which build you are looking at.** The first line is now طيف 0.6.1, and
  طيف 0.6.1 (تطوير) when it is `npm start` rather than the installed app — same line in the
  tooltip, so it is one hover. Two builds that look identical in a notification are not
  identical in the tray any more.

### Fixed

- **A task past the hour is told which quarter it is at.** "Are you still on this?" rounded
  the time down to whole hours, so a ticket that had been running an hour and a quarter, an
  hour and a half, and an hour and three quarters all read بقالها ساعة — three nudges in a
  row that each looked like the last one repeating rather than time passing. It now says
  ساعة وربع, ساعة ونص, ساعتين إلا ربع, and ساعة و20 دقيقة for the minutes that do not land
  on a quarter.
- **A notification comes from طيف, not from Electron.** Windows takes the icon and the name
  above a toast from whichever Start Menu shortcut carries the app's AppUserModelID — and a
  development run was carrying the shipped app's one. Electron rewrites its own
  `Electron.lnk` with that id on every toast, so notifications raised by the installed app
  were being attributed to Electron. `npm start` now runs under its own id and leaves the
  real one to the installed shortcut. The titles no longer start with "طيف —" either: the
  app's name belongs in the header, not in the text.

### Changed

- The Start Menu and desktop shortcut is named **طيف** rather than Tayf, because that name
  is exactly what Windows prints above every notification. Searching the Start Menu for
  `tayf` will not find it after the next install — search for طيف.

## [0.6.1] - 2026-09-02

### Fixed

- **A task handed to the testers no longer counts as work in your hands.** Jira files nine
  of this board's statuses under `indeterminate`, and Tayf trusted the bucket — so Ready
  For Testing and Testing In Progress read as "you are working on this". The result was the
  nudge that matters most never firing: with five tickets sitting in test, Tayf never said
  "nothing is In Progress, go pick something up", and it kept asking whether you were still
  on a ticket that was somebody else's. Which statuses mean the ticket is yours is now a
  setting; name none and it falls back to trusting Jira as before. A passed due date still
  nudges whoever is holding it.
- The **شغال عليها** filter in the list was reading the same bucket, and now follows the
  same setting.

### Changed

- "Nothing is In Progress" counts what you could actually start, rather than everything that
  is not closed, and stays quiet when there is nothing to start at all.

## [0.6.0] - 2026-09-02

### Added

- **Nudges.** Tayf now tells you when the board has drifted from the work. Three of them:
  nothing is In Progress while you are clearly at the machine; a task has been In Progress
  long enough that it is worth asking whether you are still on it; or a task's due date has
  come and gone and it is still open. Clicking a nudge opens the list so the fix is one
  keystroke away. The behaviour is the one written down in [docs/nudges.md](docs/nudges.md),
  and the policy itself is a pure function in `src/app/nudges.js` with 24 tests covering
  every case where it must stay quiet.
- A **النكزات** section in settings for all of it: on/off, how often, how long without a
  keystroke counts as away, working hours, working days, how often to ask whether you are
  still on a task (and whether to ask at all), and how long a task may run past its date
  before it earns a nudge (and whether to nudge about late tasks at all).
- **`npm run try-nudge`**, so a nudge can be tested without waiting for the clock. It runs
  the real policy against the real settings and the cached board, prints which gate is
  closed and how every task looks to it, and with `--anyway` or `--all` shows the actual
  toast. It is what tells a policy that is quiet on purpose apart from a notification
  Windows swallowed.
- **Snooze**, in the tray: an hour, until tomorrow morning, or back on. Without it the
  system would be hostile, and a hostile reminder gets switched off for good.
- `categoryChangedAt` on work items, from Jira's `statuscategorychangedate`. It rides
  along on the list request that already runs, and it is what makes "in progress since"
  mean something — `updated` moves whenever anyone touches the issue.

### Fixed

- **A rejected create now says what Jira wanted.** Jira answers a bad create with `400`
  and a list of the fields it is missing, but every `400` was collapsed into "Jira رجّع
  رد مش متوقع" and the list was dropped on the floor — so a task that would not save gave
  no way to find out why. The reason is now read out of `errorMessages` and `errors` and
  shown with the failure: *Jira رفض الطلب: Field Bug Source is required · Field Bugs Type
  is required · Field Description is required*. Transitions and edits get the same
  treatment, since they fail the same way. The captured response body also grew from 160
  to 600 characters, because a three-field rejection did not fit in 160.

## [0.5.0] - 2026-09-02

### Changed

- **The overlay is right-to-left.** The interface has always been Arabic but the document
  was not marked `dir="rtl"`, so the layout ran left-to-right with Arabic text inside it:
  the accent rail on the wrong edge of a row, the issue key on the wrong side, the action
  menu opening away from the text. The handful of `left`/`right` rules are now logical
  properties, so a future English build flips back by changing one attribute.

### Added

- The settings screen has a sidebar — **الاتصال** and **عام** — reachable with `Ctrl+1`
  and `Ctrl+2` or by clicking, with each preference on its own row: name and explanation
  on one side, the control on the other. The general section holds the two hotkeys and
  start-with-the-machine, which until now could only be changed from the tray menu. Those
  save the moment you change them; the connection section still saves on `Enter` because
  it verifies the credentials first. If a hotkey turns out to be taken by another program,
  the screen says so and shows the one that was registered instead.
- [docs/nudges.md](docs/nudges.md) — the agreed behaviour of the nudge system, written
  down before any of it is built.

## [0.4.1] - 2026-09-02

### Changed

- The Windows tray icon is the app logo (`assets/tray.png`, with an `@2x` for HiDPI)
  instead of the three-bar glyph, so the icon by the clock matches the one on the
  shortcut. macOS keeps its monochrome `trayTemplate` — the menu bar requires a template
  image, and a coloured one cannot be tinted for light and dark.

## [0.4.0] - 2026-09-01

### Added

- An application icon (`build/icon.png`, 1024×1024). electron-builder derives the `.ico`
  and `.icns` from it, so it is what shows on the installer, the Start Menu shortcut and
  the Dock. The tray glyph in `assets/` is unrelated and unchanged.
- Automatic updates on Windows. Tayf checks on start and every four hours, downloads in
  the background, and offers **تحديث جاهز — سطّبه دلوقتي** in the tray menu. Nothing is
  installed until you ask for it, or until the app next quits.
- A release workflow. Pushing a `v*` tag builds Windows and macOS and uploads the
  artifacts to a draft GitHub Release.

### Changed

- The Windows build is an NSIS installer (`Tayf-Setup-<version>.exe`) instead of a
  portable `Tayf.exe`. Automatic updates do not work with portable builds. It installs
  per user, needs no administrator rights, and leaves `%APPDATA%\Tayf\` alone when
  uninstalled, so settings and credentials survive.

### Known limitations

- macOS does not update itself. Squirrel refuses to update an unsigned app and the mac
  build sets `identity: null`, so the `.dmg` on the release page stays a manual
  download. Signing it later also means adding a `zip` target — macOS updates are served
  from the zip, not the dmg.
- Windows shows a SmartScreen warning on first install because the installer is
  unsigned. Updates after that are unaffected; they are verified by checksum.

## [0.2.0] - 2026-09-01

- Overlay over any app on `Ctrl+Space`, quick task creation on `Ctrl+Shift+Space`.
- Actions on a task: view, edit, change status, open in Jira, copy key.
- Windows and macOS. Restructured into layers and published under MIT.
