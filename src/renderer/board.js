import { state } from './state.js';

const TICK_MS = 30000;

export const VIEWS = ['compact', 'roomy'];

let ticker = null;
let onChange = () => {};

function persist() {
  window.tayf.savePreferences({
    board: { view: state.view, boardId: state.boardId }
  });
}

export function installBoard(handler) {
  onChange = handler;
}

export function adoptPreferences(preferences) {
  const stored = (preferences && preferences.board) || {};
  if (VIEWS.includes(stored.view)) state.view = stored.view;
  state.boardId = stored.boardId == null ? null : stored.boardId;
  onChange();
}

export function syncTicker(running) {
  if (running && !ticker) ticker = setInterval(() => onChange(), TICK_MS);
  else if (!running && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

export function setView(view) {
  if (!VIEWS.includes(view) || view === state.view) return;
  state.view = view;
  persist();
  onChange();
}

export function cycleView() {
  setView(state.view === 'compact' ? 'roomy' : 'compact');
}

export function setBoardFilter(boardId) {
  state.boardId = boardId == null ? null : boardId;
  state.selectedIndex = 0;
  persist();
  onChange();
}
