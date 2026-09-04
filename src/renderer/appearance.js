// بيمسك المظهر على <html>: data-appearance (dark|light) و data-theme.
// "زي السيستم" بيتحل هنا مش في الـ CSS — كده بلوك الألوان الفاتح متكتب مرة واحدة.

const SYSTEM_LIGHT = window.matchMedia('(prefers-color-scheme: light)');

// الأسامي المعروضة عايشة في index.html على أزرار المجموعة، فهنا القيم بس.
export const APPEARANCES = ['system', 'light', 'dark'];

export const THEMES = [
  { value: 'amber', label: 'كهرماني' },
  { value: 'blue', label: 'أزرق' },
  { value: 'violet', label: 'بنفسجي' },
  { value: 'green', label: 'أخضر' },
  { value: 'rose', label: 'وردي' }
];

export const SCALES = [
  { value: 0.9, label: 'صغيرة · ٩٠٪' },
  { value: 1, label: 'عادية · ١٠٠٪' },
  { value: 1.15, label: 'كبيرة · ١١٥٪' },
  { value: 1.3, label: 'أكبر · ١٣٠٪' }
];

let preference = 'system';

function resolve() {
  if (preference === 'light' || preference === 'dark') return preference;
  return SYSTEM_LIGHT.matches ? 'light' : 'dark';
}

export function applyAppearance(next) {
  preference = APPEARANCES.includes(next) ? next : 'system';
  document.documentElement.dataset.appearance = resolve();
}

export function applyTheme(next) {
  const known = THEMES.some((option) => option.value === next);
  document.documentElement.dataset.theme = known ? next : 'amber';
}

export function applyPreferences(preferences) {
  applyAppearance(preferences.appearance);
  applyTheme(preferences.theme);
}

SYSTEM_LIGHT.addEventListener('change', () => {
  if (preference === 'system') document.documentElement.dataset.appearance = resolve();
});
