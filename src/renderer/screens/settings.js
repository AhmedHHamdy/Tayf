import elements from '../elements.js';
import { state } from '../state.js';
import { showLayout, paintBanners, setContext } from '../chrome.js';
import { backToTaskList } from './task-list.js';

const CLOSE_DELAY_MS = 900;

let saving = false;

function setNote(text, className) {
  elements.snote.textContent = text || '';
  elements.snote.className = className || '';
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

    elements.ssite.focus();
    elements.ssite.select();
  },

  render() {
    showLayout('settings');
    paintBanners();
    state.rows = [];
  }
};

elements.tokenlink.addEventListener('click', () => window.tayf.openTokenPage());
