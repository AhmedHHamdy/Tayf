export const state = {
  workspace: {
    configured: false,
    error: null,
    failure: null,
    items: [],
    fetchedAt: null,
    user: null,
    transitionsNeedingWorklog: []
  },
  rows: [],
  selectedIndex: 0,
  filter: 'all',
  busy: false
};

export function setWorkspace(next) {
  state.workspace = next;
}

export function clampSelection() {
  if (state.selectedIndex >= state.rows.length) {
    state.selectedIndex = Math.max(0, state.rows.length - 1);
  }
  if (state.selectedIndex < 0) state.selectedIndex = 0;
}

export function selectedRow() {
  return state.rows[state.selectedIndex] || null;
}
