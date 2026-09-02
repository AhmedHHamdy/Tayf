# Nudges

*[بالعربي](nudges.ar.md)*

A nudge is Tayf talking to you about your own board. A notification is Tayf telling you
what somebody else did. They are separate systems and they should stay separate.

## Why nudge at all

A board is only useful if it is true, and there are three ways yours lies:

- you are working and nothing is In Progress — the board says you are idle, and you
  simply forgot to move the card
- a card says In Progress but you finished it an hour ago and never closed it
- a card's date has passed and the card is still open — the board is still promising a
  day that is already gone

They are the same failure: the board drifts away from the work. Nobody fixes that by
remembering harder.

## The rules

Nudge every fifteen minutes while nothing is In Progress. **Never nudge when:**

- the keyboard and mouse have not been touched for ten minutes. `powerMonitor.getSystemIdleTime()`
  gives us this for nothing, and it is the whole difference between a nudge that helps
  and one that gets the app uninstalled on day two.
- the screen is locked or the machine is asleep
- it is outside working hours
- it was snoozed
- **there are no tasks at all.** "Move a card" is nonsense when there is nothing to move.

Clicking a nudge opens the list. A nudge you cannot act on immediately is just noise, so
the fix is always one keystroke away.

Snooze is not a nice-to-have. An hour, until tomorrow, done for today. Without it the
system is hostile and gets switched off, which costs more than never having built it.

While a card *is* In Progress, the question changes from "start something" to "are you
still on this?" — asked every ninety minutes, and only once the card has been running
that long, so picking up a task does not immediately get you asked about it.

The late case is quieter still: a card whose due date has passed — by a day of grace, so
the deadline itself is not the alarm — earns one nudge a day, not one every ninety
minutes. It also claims the card: a card that is late is the overdue nudge's, and Tayf
will not also ask whether you are still on it, because "you are past the date" already
contains "are you still on this". Every other In Progress card is still asked about
normally — and if you switch the overdue nudge off, late cards go back to being asked
about too, rather than falling silent with nobody watching them.

A card with no due date is never late. Nothing to be late against.

## Every number here is a setting

Fifteen minutes, ten minutes idle, 08:00–18:00, ninety minutes between check-ins, one day
of grace past a due date. Those are defaults, not rules — all of them are editable, and
the check-in and the overdue nudge can each be switched off on their own, because one
company's hours are not everybody's.

## Where it lives

The policy is a pure function under `src/app/`: given the items, the idle seconds, the
clock and the settings, decide whether to nudge and about what. No Electron import, no
network, so the entire policy is testable without either. `src/main/` supplies the idle
time and shows the notification.

This is the same separation the rest of the codebase follows — see
[architecture.md](architecture.md).

## Trying one without waiting for the clock

`npm run try-nudge` runs the real policy against your real settings and your cached board,
then prints which gate is closed — switched off, snoozed, away from the machine, outside
working hours, nothing to move — and what each task looks like to it. Add `--anyway` to
ignore the clock and the idle check and actually show the toast, or `--all` to see all
three kinds in a row. It is the fastest way to tell a policy that stays quiet on purpose
from a notification the system swallowed.
