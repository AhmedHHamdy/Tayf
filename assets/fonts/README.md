# الخطوط

| ملف | الخط | الاستخدام | الرخصة |
|---|---|---|---|
| `cairo-arabic.woff2` | Cairo Variable | النص العربي (الافتراضي) | SIL OFL 1.1 |
| `inter-latin.woff2` | Inter Variable | النص اللاتيني والأرقام (الافتراضي) | SIL OFL 1.1 |
| `readex-arabic.woff2` | Readex Pro Variable | النص العربي (اختيار بديل) | SIL OFL 1.1 |
| `readex-latin.woff2` | Readex Pro Variable | النص اللاتيني والأرقام (اختيار بديل) | SIL OFL 1.1 |

كلهم نسخ من `@fontsource-variable/*` — الحزم موجودة في `devDependencies`
عشان مصدر الملفات ونسخته يفضلوا موثّقين. الملفات نفسها متسنّدة هنا لأن
`node_modules` مش بيتشحن مع التطبيق.

خط SF بتاع Apple مش موجود هنا عن قصد: رخصته بتسمح باستخدامه على منصات
Apple بس، وطيف بيشتغل على ويندوز ولينكس كمان. وبنفس المنطق أي خط تجاري
(زي Ping AR LT) مينفعش يتسند هنا — الريبو MIT ومحتاج خطوط حرة.
