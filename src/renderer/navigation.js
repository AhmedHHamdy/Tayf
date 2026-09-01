const screens = new Map();
let active = null;

export function registerScreen(screen) {
  screens.set(screen.name, screen);
}

export function activeScreen() {
  return active;
}

export function activeScreenName() {
  return active ? active.name : null;
}

export async function goTo(name, payload) {
  const next = screens.get(name);
  if (!next) throw new Error(`unknown screen: ${name}`);

  if (active && active !== next && active.leave) active.leave();
  active = next;
  if (next.enter) await next.enter(payload || {});
}

export function repaint() {
  if (active && active.render) active.render();
}
