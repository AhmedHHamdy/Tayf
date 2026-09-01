# Tayf — طيف

*[بالعربي](README.md)*

Press **Ctrl + Space** in any application → a translucent overlay appears on top of
everything → see your Jira issues, change their status, or add a new one → press
**Esc** → you are back where you were.

No browser, no context switch.

## Why

Checking "what's on my plate?", moving a ticket, or capturing a task your manager
just asked for all mean opening a browser, finding the tab, and waiting for Jira to
load. The time is not really the problem — the broken concentration is.

## Shortcuts

| | |
|---|---|
| `Ctrl + Space` | the list — my issues |
| `Ctrl + Shift + Space` | add an issue straight away |

On macOS these are `⌥ Space` and `⌥ ⇧ Space`, because `Ctrl+Space` is taken by the
keyboard layout switcher.

**In the list:** `↑` `↓` move · **`→` item actions** (view · edit · change status ·
open in Jira · copy key) · `Tab` change status · `Enter` view · `Esc` close.
Filters across the top: all · today · overdue · in progress. Search matches the key,
title, type, and board name.

**Adding:** type a title, press `Enter`, done — it reuses your last board and issue
type. If you want to be specific: board · type · assignee · due date · estimate ·
description. The due date field understands `today`, `tomorrow`, weekday names,
`+3`, and plain dates; a bare number in the estimate field means minutes.

## The interesting problem: one project, several boards

A project often has several boards, each filtering by a different clause. Tayf
**reads the board's filter and works out what an issue needs** to appear on it, sets
those fields, and shows you what it is about to do before it does it:

| Board | Tayf sets |
|---|---|
| FPE - React | `Labels = React` |
| FPE - Product Design | `Task Type = UI Task` |
| FPE - Tech | nothing — this is the default board |

This is derived from the board configuration at runtime, not hardcoded for any
particular project.

## Running it

```bash
npm install
cp config.example.json config.json   # fill in site, email, API token
npm start
```

Create a token at
[id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens).
You can also enter it from inside the app: tray icon → Settings.

**Your data stays on your machine.** There is no server and no telemetry. The token
is stored in the app's user-data directory and is never sent anywhere except Jira.

For a standalone build: `npm run dist`.

## How it is built

| | |
|---|---|
| Stack | Electron · plain JavaScript · no build step |
| Platforms | Windows · macOS (Linux needs one file — see contributing) |
| Jira | Jira Cloud · API token auth |
| Tests | `node --test`, no dependencies |

The code is layered: the UI does not know Jira exists, and everything Jira-specific
is confined to `src/providers/jira/`. Details in
[docs/architecture.md](docs/architecture.md).

**The code has no comments, on purpose** — it is meant to read on its own. The
knowledge code cannot express (where Jira's API lies to you, how focus differs
between Windows and macOS) lives in
[docs/jira-quirks.md](docs/jira-quirks.md). Read it before changing things.

## Contributing

Contributions are welcome — start with [CONTRIBUTING.md](CONTRIBUTING.md).

Most useful right now: Linux support · extracting UI strings for translation ·
storing the token in the OS keychain · rate-limit backoff.

## License

[MIT](LICENSE)
