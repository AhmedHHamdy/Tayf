# Changelog

Notable changes to Tayf. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
While Tayf is on 0.x, a minor bump is a feature and a patch is a fix.

## [Unreleased]

### Added

- **Nudges.** Tayf now tells you when the board has drifted from the work: nothing is In
  Progress while you are clearly at the machine, or something has been In Progress past
  its welcome. Clicking a nudge opens the list so the fix is one keystroke away. The
  behaviour is the one written down in [docs/nudges.md](docs/nudges.md), and the policy
  itself is a pure function in `src/app/nudges.js` with 14 tests covering every case
  where it must stay quiet.
- A **النكزات** section in settings for all of it: on/off, how often, how long without a
  keystroke counts as away, working hours, working days, and when a task counts as stale.
- **Snooze**, in the tray: an hour, until tomorrow morning, or back on. Without it the
  system would be hostile, and a hostile reminder gets switched off for good.
- `categoryChangedAt` on work items, from Jira's `statuscategorychangedate`. It rides
  along on the list request that already runs, and it is what makes "in progress since"
  mean something — `updated` moves whenever anyone touches the issue.

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
