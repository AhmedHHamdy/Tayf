import elements from './elements.js';
import { state } from './state.js';
import { escapeHtml, relativeTime } from './format.js';

const FLASH_TIMEOUT_MS = 8000;

const SCREEN_PARTS = {
  tasks: { roots: ['list', 'msg'], footer: 'foot', bar: true, filters: true },
  transitions: { roots: ['list', 'msg'], footer: 'foot', bar: true, filters: false },
  transitionForm: { roots: ['finish'], footer: 'footf', bar: false, filters: false },
  compose: { roots: ['create'], footer: 'footc', bar: true, filters: false },
  edit: { roots: ['create'], footer: 'footd', bar: true, filters: false },
  itemView: { roots: ['view'], footer: 'footv', bar: false, filters: false },
  settings: { roots: ['settings'], footer: 'foots', bar: false, filters: false }
};

const ALL_ROOTS = ['list', 'msg', 'create', 'view', 'settings', 'finish'];
const ALL_FOOTERS = ['foot', 'footc', 'footd', 'footv', 'foots', 'footf'];

let flash = null;
let flashTimer = null;

export function setVisible(element, visible, display = 'block') {
  element.style.display = visible ? display : 'none';
}

export function showLayout(layoutName) {
  const layout = SCREEN_PARTS[layoutName];
  ALL_ROOTS.forEach((id) => setVisible(elements[id], false));
  ALL_FOOTERS.forEach((id) => setVisible(elements[id], false));

  setVisible(elements.bar, layout.bar, 'flex');
  setVisible(elements.filters, layout.filters && state.workspace.configured, 'flex');
  setVisible(elements[layout.footer], true, 'flex');
  layout.roots.forEach((id) => setVisible(elements[id], true));
}

export function setContext(html) {
  elements.ctx.innerHTML = html || '';
  setVisible(elements.ctx, !!html);
}

export function setFlash(html, className) {
  clearTimeout(flashTimer);
  flash = html ? { html, className: className || '' } : null;
  if (flash && className !== 'pending') {
    flashTimer = setTimeout(() => {
      flash = null;
      paintFlash();
    }, FLASH_TIMEOUT_MS);
  }
  paintFlash();
}

export function paintFlash() {
  if (!flash) {
    setVisible(elements.ok, false);
    return;
  }
  elements.ok.innerHTML = flash.html;
  elements.ok.className = flash.className;
  setVisible(elements.ok, true);
}

export function paintBanners() {
  const { error, failure } = state.workspace;

  elements.banner.textContent = error || '';
  setVisible(elements.banner, !!error);

  if (failure) {
    const key = failure.key ? `<b>${escapeHtml(failure.key)}</b> ` : '';
    elements.fail.innerHTML =
      `<div class="ttl">${key}الأكشن ده ماتنفذش</div>` +
      `<div class="msg">${escapeHtml(failure.message)}</div>` +
      '<div class="hint">دوس هنا تقفل الرسالة · التاسك رجعت لحالتها الأصلية</div>';
  }
  setVisible(elements.fail, !!failure);

  paintFlash();
}

export function setFooterMeta(id, text) {
  elements[id].textContent = text || '';
}

export function itemCountMeta() {
  const { items, fetchedAt } = state.workspace;
  return `${items.length} تاسك · ${relativeTime(fetchedAt)}`;
}
