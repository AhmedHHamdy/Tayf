import elements from '../elements.js';
import { state } from '../state.js';
import { showLayout, paintBanners, setContext } from '../chrome.js';
import { escapeHtml } from '../format.js';
import { backToTaskList } from './task-list.js';

const CLOSE_DELAY_MS = 900;
const TABS = ['conn', 'nudge', 'gen'];
const PANES = { conn: 'pconn', nudge: 'pnudge', gen: 'pgen' };
const AUTO_START_HINT = { darwin: 'يفتح لوحده مع الماك.' };
const DAY_LETTERS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const EVERY_CHOICES = [1, 5, 10, 15, 20, 30, 45, 60];
const IDLE_CHOICES = [1, 3, 5, 10, 15, 20, 30];
const CHECK_CHOICES = [1, 5, 15, 30, 45, 60, 90, 120, 180, 240];
const OVERDUE_CHOICES = [1, 2, 3, 5, 7];

let saving = false;
let activeTab = 'conn';

function setNote(text, className) {
  elements.snote.textContent = text || '';
  elements.snote.className = className || '';
}

function fillChoices(select, choices, current) {
  select.innerHTML = (choices || [])
    .map((choice) => {
      const selected = choice.accelerator === current ? ' selected' : '';
      return `<option value="${escapeHtml(choice.accelerator)}"${selected}>${escapeHtml(choice.label)}</option>`;
    })
    .join('');
}

function fillNumbers(select, values, current, unit) {
  select.innerHTML = values
    .map((value) => {
      const selected = value === current ? ' selected' : '';
      return `<option value="${value}"${selected}>${value} ${unit}</option>`;
    })
    .join('');
}

function paintDays(days) {
  elements.snudgedays.innerHTML = DAY_LETTERS.map((letter, index) => {
    const on = days.includes(index) ? ' on' : '';
    return `<span class="sday${on}" data-d="${index}">${letter}</span>`;
  }).join('');
}

function chosenDays() {
  return [...elements.snudgedays.querySelectorAll('.sday.on')].map((chip) =>
    Number(chip.dataset.d)
  );
}

function paintPreferences(preferences) {
  fillChoices(elements.shotkey, preferences.toggleChoices, preferences.toggleHotkey);
  fillChoices(elements.saddkey, preferences.composeChoices, preferences.composeHotkey);
  elements.sauto.checked = !!preferences.autoStart;
  elements.sautotext.textContent =
    AUTO_START_HINT[window.tayf.platform] || 'يفتح لوحده مع الويندوز.';

  const nudges = preferences.nudges || {};
  elements.snudge.checked = !!nudges.enabled;
  fillNumbers(elements.snudgeevery, EVERY_CHOICES, nudges.everyMinutes, 'دقيقة');
  fillNumbers(elements.snudgeidle, IDLE_CHOICES, nudges.idleMinutes, 'دقيقة');
  elements.snudgestart.value = nudges.workStart || '';
  elements.snudgeend.value = nudges.workEnd || '';
  elements.snudgecheck.checked = !!nudges.checkEnabled;
  fillNumbers(elements.snudgecheckevery, CHECK_CHOICES, nudges.checkMinutes, 'دقيقة');
  elements.snudgeoverdue.checked = !!nudges.overdueEnabled;
  fillNumbers(elements.snudgeoverduedays, OVERDUE_CHOICES, nudges.overdueDays, 'يوم');
  paintDays(nudges.workDays || []);
}

function refused(requested, registered, choices) {
  if (!requested || requested === registered) return null;
  const fallback = (choices || []).find((choice) => choice.accelerator === registered);
  return `الاختصار ده محجوز لبرنامج تاني — طيف خد ${fallback ? fallback.label : registered}`;
}

async function savePreference(patch) {
  const preferences = await window.tayf.savePreferences(patch);
  paintPreferences(preferences);

  const problem =
    refused(patch.toggleHotkey, preferences.toggleHotkey, preferences.toggleChoices) ||
    refused(patch.composeHotkey, preferences.composeHotkey, preferences.composeChoices);

  setNote(problem || 'اتحفظ.', problem ? 'bad' : 'good');
}

export function showTab(name) {
  if (!PANES[name]) return;
  activeTab = name;

  TABS.forEach((tab) => elements[PANES[tab]].classList.toggle('on', tab === name));
  elements.snav.querySelectorAll('.snavitem').forEach((item) =>
    item.classList.toggle('on', item.dataset.t === name)
  );

  const first = elements[PANES[name]].querySelector('input, select');
  if (first) {
    first.focus();
    if (first.select) first.select();
  }
}

export function showTabByNumber(number) {
  const name = TABS[number - 1];
  if (name) showTab(name);
  return !!name;
}

export function onConnectionTab() {
  return activeTab === 'conn';
}

export async function save() {
  if (saving) return;
  saving = true;
  setNote('بيحفظ وبيجرّب الاتصال…', '');

  const response = await window.tayf.saveConfig({
    site: elements.ssite.value,
    email: elements.semail.value,
    token: elements.stoken.value
  });
  saving = false;

  if (response.error) {
    setNote(response.error, 'bad');
    return;
  }

  setNote(`تمام — متصلين باسم ${response.name || ''}. الطبقة هتقفل دلوقتي.`, 'good');
  elements.stoken.value = '';
  setTimeout(async () => {
    await backToTaskList();
    window.tayf.close();
  }, CLOSE_DELAY_MS);
}

export const settingsScreen = {
  name: 'settings',

  async enter() {
    setContext('');
    this.render();
    setNote('', '');

    const stored = await window.tayf.readConfig();
    elements.ssite.value = stored.site || '';
    elements.semail.value = stored.email || '';
    elements.stoken.value = '';
    elements.stoken.placeholder = stored.hasToken
      ? 'متحفوظ — سيبه فاضي لو مش هتغيّره'
      : 'الصق الـ API Token';

    paintPreferences(await window.tayf.readPreferences());
    showTab(state.workspace.configured ? activeTab : 'conn');
  },

  render() {
    showLayout('settings');
    paintBanners();
    state.rows = [];
  }
};

elements.tokenlink.addEventListener('click', () => window.tayf.openTokenPage());
elements.snav.addEventListener('click', (event) => {
  const item = event.target.closest('.snavitem');
  if (item) showTab(item.dataset.t);
});
elements.shotkey.addEventListener('change', () =>
  savePreference({ toggleHotkey: elements.shotkey.value })
);
elements.saddkey.addEventListener('change', () =>
  savePreference({ composeHotkey: elements.saddkey.value })
);
elements.sauto.addEventListener('change', () =>
  savePreference({ autoStart: elements.sauto.checked })
);

const saveNudge = (patch) => savePreference({ nudges: patch });

elements.snudge.addEventListener('change', () => saveNudge({ enabled: elements.snudge.checked }));
elements.snudgeevery.addEventListener('change', () =>
  saveNudge({ everyMinutes: Number(elements.snudgeevery.value) })
);
elements.snudgeidle.addEventListener('change', () =>
  saveNudge({ idleMinutes: Number(elements.snudgeidle.value) })
);
elements.snudgeoverdue.addEventListener('change', () =>
  saveNudge({ overdueEnabled: elements.snudgeoverdue.checked })
);
elements.snudgeoverduedays.addEventListener('change', () =>
  saveNudge({ overdueDays: Number(elements.snudgeoverduedays.value) })
);
elements.snudgecheck.addEventListener('change', () =>
  saveNudge({ checkEnabled: elements.snudgecheck.checked })
);
elements.snudgecheckevery.addEventListener('change', () =>
  saveNudge({ checkMinutes: Number(elements.snudgecheckevery.value) })
);
elements.snudgestart.addEventListener('change', () => {
  if (elements.snudgestart.value) saveNudge({ workStart: elements.snudgestart.value });
});
elements.snudgeend.addEventListener('change', () => {
  if (elements.snudgeend.value) saveNudge({ workEnd: elements.snudgeend.value });
});
elements.snudgedays.addEventListener('click', (event) => {
  const chip = event.target.closest('.sday');
  if (!chip) return;

  const day = Number(chip.dataset.d);
  const days = chosenDays();
  const next = days.includes(day)
    ? days.filter((chosen) => chosen !== day)
    : [...days, day].sort((first, second) => first - second);

  saveNudge({ workDays: next });
});
