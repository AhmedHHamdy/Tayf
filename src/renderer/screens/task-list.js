import elements from '../elements.js';
import { state, clampSelection } from '../state.js';
import { goTo } from '../navigation.js';
import { showLayout, setContext, paintBanners, setFooterMeta, itemCountMeta } from '../chrome.js';
import { paintRows, itemRowHtml } from '../list-view.js';
import { toIsoDate } from '../dates.js';

const SETUP_STEPS =
  '<h3>وصّلها بـ Jira بتاعك</h3>' +
  '<ol>' +
  '<li>اعمل API Token من <code>id.atlassian.com/manage-profile/security/api-tokens</code></li>' +
  '<li>افتح الإعدادات من أيقونة الساعة</li>' +
  '<li>املا الموقع والإيميل والتوكن</li>' +
  '</ol>' +
  '<span class="note">الملف على جهازك بس. التوكن مبيتبعتش لأي حد.</span>';

export const FILTERS = ['all', 'today', 'late', 'wip'];

const MATCHES_FILTER = {
  all: () => true,
  today: (item, today) => !!item.due && item.due <= today,
  late: (item, today) => !!item.due && item.due < today,
  wip: (item) => item.category === 'indeterminate'
};

export function visibleItems() {
  const today = toIsoDate(new Date());
  const query = elements.search.value.trim().toLowerCase();

  const filtered = state.workspace.items.filter((item) =>
    MATCHES_FILTER[state.filter](item, today)
  );
  if (!query) return filtered;

  return filtered.filter((item) => {
    const boards = (item.boards || []).map((board) => board.name).join(' ');
    const haystack = `${item.key} ${item.title} ${item.type || ''} ${boards}`;
    return haystack.toLowerCase().includes(query);
  });
}

export function setFilter(name) {
  state.filter = name;
  state.selectedIndex = 0;
  Array.from(elements.filters.children).forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.f === name);
  });
  taskListScreen.render();
  elements.search.focus();
}

export const taskListScreen = {
  name: 'tasks',

  enter({ restoreKey } = {}) {
    setContext('');
    elements.search.value = '';
    elements.search.placeholder = 'دوّر على تاسك';

    const rows = visibleItems();
    const index = restoreKey ? rows.findIndex((row) => row.key === restoreKey) : -1;
    state.selectedIndex = index >= 0 ? index : 0;

    this.render();
    elements.search.focus();
  },

  render() {
    showLayout('tasks');
    paintBanners();

    if (!state.workspace.configured) {
      elements.list.style.display = 'none';
      elements.msg.style.display = 'block';
      elements.msg.innerHTML = SETUP_STEPS;
      state.rows = [];
      setFooterMeta('meta', '');
      return;
    }

    const rows = visibleItems();
    const empty = elements.search.value ? 'مفيش نتايج.' : 'مفيش تاسكات مسندة ليك.';
    paintRows(rows, empty, (item, _index, selected) => itemRowHtml(item, selected));
    clampSelection();
    setFooterMeta('meta', itemCountMeta());
  }
};

export function backToTaskList(restoreKey) {
  return goTo('tasks', { restoreKey });
}
