# Changelog

Notable changes to Tayf. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
While Tayf is on 0.x, a minor bump is a feature and a patch is a fix.

## [Unreleased]

### Added

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
