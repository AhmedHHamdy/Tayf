const TYPE_BADGES = [
  { match: (name) => name.startsWith('sub') || name.includes('sub-task'), badge: 'SUB', className: 'ty-sub' },
  { match: (name) => name.includes('bug'), badge: 'BUG', className: 'ty-bug' },
  { match: (name) => name.includes('story'), badge: 'STORY', className: 'ty-story' },
  { match: (name) => name.includes('epic'), badge: 'EPIC', className: 'ty-epic' },
  { match: (name) => name.includes('enhance'), badge: 'ENH', className: '' },
  { match: (name) => name.includes('meeting'), badge: 'MTG', className: '' }
];

const DEFAULT_BADGE = { badge: 'TASK', className: '' };
const FILLED_SEGMENTS = { new: 1, indeterminate: 2, done: 3 };
const TOTAL_SEGMENTS = 3;

export const UNTITLED = '(بدون عنوان)';
export const NO_STATUS = '—';

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function typeBadge(typeName) {
  const name = String(typeName || '').toLowerCase();
  const found = TYPE_BADGES.find((candidate) => candidate.match(name));
  return found ? { badge: found.badge, className: found.className } : DEFAULT_BADGE;
}

export function boardLabel(item) {
  const boards = item.boards || [];
  if (!boards.length) return { short: '', full: '' };

  const projectPrefix = String(item.key || '').split('-')[0].replace(/[^A-Za-z0-9_]/g, '');
  const redundantPrefix = projectPrefix
    ? new RegExp(`^${projectPrefix}[ ]*[-–—:·][ ]*`, 'i')
    : null;

  const names = boards.map((board) => {
    const name = String(board.name || '');
    return redundantPrefix ? name.replace(redundantPrefix, '') : name;
  });

  return {
    short: names[0] + (names.length > 1 ? ` +${names.length - 1}` : ''),
    full: boards.map((board) => board.name).join('  ·  ')
  };
}

export function progressTrack(category) {
  const filled = FILLED_SEGMENTS[category] || 1;
  let html = '<span class="track">';
  for (let segment = 1; segment <= TOTAL_SEGMENTS; segment += 1) {
    html += `<span class="seg${segment <= filled ? ' f' : ''}"></span>`;
  }
  return `${html}</span>`;
}

export function relativeTime(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'الآن';
  if (seconds < 3600) return `من ${Math.round(seconds / 60)}د`;
  return `من ${Math.round(seconds / 3600)}س`;
}
