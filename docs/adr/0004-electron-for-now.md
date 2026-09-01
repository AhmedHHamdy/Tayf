# ADR-0004 — Electron for now, layered so Tauri stays possible

**Status:** accepted · **Date:** 2026-09-01 · **Supersedes:** [ADR-0001](0001-tauri.md)

**الحالة:** مقبول · **التاريخ:** 2026-09-01 · **بيحل محل:** [ADR-0001](0001-tauri.md)

---

## Context

[ADR-0001](0001-tauri.md) chose Tauri v2 for size and idle memory. The spike that
actually got built was Electron, because the hard parts turned out not to be the
shell: restoring focus on Windows, and reading board filters to work out what an
issue needs. Both were solved in JavaScript, and the tool has been in daily use since.

Opening the project up meant choosing between shipping the working Electron app or
pausing to rewrite it in Rust.

## Decision

**Keep Electron.** Restructure it into layers instead — `renderer → preload → main →
app → providers/storage` — so that the shell is the only thing a future Tauri move
would replace.

The parts that carry the real knowledge (`providers/jira/`, `app/workspace.js`) have
no Electron imports and no DOM. A Tauri port would be a new shell, not a rewrite.

## Alternatives rejected

- **Port to Tauri now.** Months of work with the tool out of service, and no
  contributor could help during it. The 96 MB → ~10 MB win is real but does not
  outweigh a working tool going dark.
- **Electron with no restructuring.** Fastest, but a 2,000-line HTML file and a
  564-line main process is not something anyone contributes to.

## Consequences

**Good:** the app keeps working throughout · contributors can start on day one ·
the provider seam from ADR-0002 is now real code, not a plan · no build step, so
what you edit is what runs.

**Bad:** ~96 MB and Electron's idle memory, both of which ADR-0001 called out as
the reason to avoid it · the Tauri decision is deferred, not resolved.

**Revisit when:** idle resource use is an actual complaint from actual users, rather
than a number we dislike on principle.

---

## السياق

[ADR-0001](0001-tauri.md) اختار Tauri v2 عشان الحجم والذاكرة وقت الخمول. اللي
اتبنى فعلاً كان Electron، لأن الجزء الصعب طلع مش الـ shell: رجوع الفوكس على
ويندوز، وقراءة فلاتر البوردات عشان نعرف التاسك محتاجة إيه. الاتنين اتحلوا
بالجافاسكريبت، والأداة مستخدمة يومياً من ساعتها.

فتح المشروع للناس معناه نختار: نطلّع نسخة Electron الشغالة، ولا نقف نعيد كتابتها
بـ Rust.

## القرار

**نفضل على Electron.** ونعيد ترتيبه لطبقات بدل كده — `renderer → preload → main →
app → providers/storage` — عشان الـ shell يبقى هو الحاجة الوحيدة اللي التحويل
لـ Tauri هيبدّلها.

الأجزاء اللي شايلة المعرفة الحقيقية (`providers/jira/` و`app/workspace.js`) مفيهاش
استيراد لإلكترون ولا DOM. التحويل لـ Tauri هيبقى shell جديد، مش إعادة كتابة.

## البدائل المرفوضة

- **نحوّل لـ Tauri دلوقتي.** شهور شغل والأداة واقفة، ومحدش يقدر يساعد وقتها.
  فرق الـ 96 ميجا لـ ~10 حقيقي، بس مايستاهلش إن أداة شغالة تقف.
- **Electron من غير إعادة ترتيب.** أسرع حاجة، بس ملف HTML بـ 2000 سطر وعملية
  رئيسية بـ 564 سطر محدش هيساهم فيهم.

## العواقب

**الحلو:** الأداة فاضلة شغالة طول الوقت · الناس تقدر تساهم من أول يوم ·
خط المزوّدين بتاع ADR-0002 بقى كود حقيقي مش خطة · مفيش خطوة بناء، فاللي
بتعدّله هو اللي بيشتغل.

**الوحش:** ~96 ميجا وذاكرة إلكترون وقت الخمول، والاتنين ADR-0001 قالهم كسبب
لتجنّبه · قرار Tauri اتأجّل، ماتحلّش.

**نراجعه إمتى:** لما استهلاك الموارد يبقى شكوى حقيقية من ناس حقيقية، مش رقم
مش عاجبنا من حيث المبدأ.
