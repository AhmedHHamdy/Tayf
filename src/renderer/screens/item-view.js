import elements from '../elements.js';
import { state } from '../state.js';
import { showLayout, paintBanners, setContext, setFooterMeta } from '../chrome.js';
import { escapeHtml } from '../format.js';

const context = { detail: null, requestId: 0 };

export function currentDetail() {
  return context.detail;
}

function metaEntries(item, detail) {
  const entries = [
    ['', detail.key],
    ['النوع', detail.type || '-'],
    ['الحالة', detail.status || '-'],
    ['مسندة لـ', detail.assignee || 'مش مسندة']
  ];

  if ((item.boards || []).length) {
    entries.push(['البورد', item.boards.map((board) => board.name).join('، ')]);
  }
  if (detail.due) entries.push(['التسليم', detail.due]);
  if (detail.estimate) entries.push(['الوقت', detail.estimate]);

  Object.values(detail.optionValues || {}).forEach((option) => entries.push(['', option.value]));
  if ((detail.labels || []).length) entries.push(['labels', detail.labels.join('، ')]);

  return entries;
}

export const itemViewScreen = {
  name: 'itemView',

  async enter({ item }) {
    context.detail = null;
    setContext('');

    elements.vtitle.textContent = item.title || '';
    elements.vmeta.innerHTML = '';
    elements.vdesc.textContent = 'بيحمّل…';
    elements.vdesc.className = 'empty';
    setFooterMeta('metav', item.key);

    this.render();
    elements.search.blur();

    const requestId = ++context.requestId;
    const response = await window.tayf.item(item.key);
    if (requestId !== context.requestId) return;

    if (response.error) {
      elements.vdesc.textContent = response.error;
      return;
    }

    const detail = response.item;
    context.detail = detail;
    elements.vtitle.textContent = detail.title;
    elements.vmeta.innerHTML = metaEntries(item, detail)
      .map(
        ([label, value]) =>
          `<span>${label ? `<b>${escapeHtml(label)}</b>` : ''}${escapeHtml(value)}</span>`
      )
      .join('');

    if (detail.description) {
      elements.vdesc.textContent = detail.description;
      elements.vdesc.className = '';
    } else {
      elements.vdesc.textContent = 'مفيش وصف للتاسك دي.';
      elements.vdesc.className = 'empty';
    }
  },

  leave() {
    context.requestId += 1;
    context.detail = null;
  },

  render() {
    showLayout('itemView');
    paintBanners();
    state.rows = [];
  }
};
