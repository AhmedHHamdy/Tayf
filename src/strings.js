'use strict';

const ERROR_TEXT = {
  'no-connection': 'مفيش اتصال بالنت أو اسم الموقع غلط.',
  'bad-credentials': 'الإيميل أو الـ API Token غلط.',
  forbidden: 'الحساب مالوش صلاحية للعملية دي.',
  'not-found': 'المسار مش موجود — يمكن اسم الموقع غلط.',
  'rate-limited': 'Jira قال استنى شوية (rate limit). جرّب كمان لحظة.',
  'jira-unavailable': 'Jira نفسه واقع دلوقتي.',
  'unexpected-response': 'Jira رجّع رد مش متوقع.',
  'not-configured': 'مفيش إعدادات — افتح الإعدادات وحطّ بيانات Jira.',
  'save-failed': 'مقدرناش نحفظ الإعدادات.',
  'site-required': 'اكتب اسم الموقع',
  'email-required': 'اكتب الإيميل',
  'token-required': 'اكتب الـ API Token',
  'worklog-required':
    'جيرا عايز وقت مسجّل على التاسك. اختار الحالة تاني وهيسألك عن الوقت المرة دي.'
};

const TRAY_TEXT = {
  appName: 'طيف',
  needsSetup: 'محتاج إعداد',
  connectionProblem: 'فيه مشكلة في الاتصال',
  itemCount: (count) => `${count} تاسك`,
  open: 'افتح',
  newItem: 'تاسك جديدة',
  refreshNow: 'حدّث دلوقتي',
  hotkey: 'الاختصار',
  settings: 'الإعدادات',
  errorLog: 'سجل الأخطاء',
  openConfigFile: 'افتح ملف الإعدادات',
  restart: 'إعادة تشغيل',
  quit: 'خروج',
  startWithWindows: 'يشتغل مع ويندوز',
  startWithMac: 'يشتغل مع الماك',
  checkUpdates: 'شوف لو فيه تحديث',
  checkingUpdates: 'بيدوّر على تحديث…',
  downloadingUpdate: 'بينزّل التحديث…',
  updateReady: (version) => `تحديث ${version} جاهز — سطّبه دلوقتي`
};

const NOTIFICATION_TEXT = {
  actionFailedTitle: (key) => `طيف — ${key ? `${key} ماتنفذش` : 'الأكشن ماتنفذش'}`,
  transitionFailed: (status, reason) => `مانتقلش لـ ${status} — ${reason}`,
  updateFailed: (reason) => `ماتعدّلتش — ${reason}`,
  createFailed: (reason) => `التاسك ماتعملتش — ${reason}`
};

function errorText(error) {
  if (!error) return ERROR_TEXT['unexpected-response'];
  const known = ERROR_TEXT[error.code];
  if (!known) return error.message || ERROR_TEXT['unexpected-response'];
  if (error.code === 'jira-unavailable' && error.status) {
    return `${known} (${error.status})`;
  }
  return known;
}

module.exports = { ERROR_TEXT, TRAY_TEXT, NOTIFICATION_TEXT, errorText };
