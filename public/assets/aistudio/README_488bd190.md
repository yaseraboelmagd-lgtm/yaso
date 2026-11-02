# المحامي الذكي: حالة المشروع

**تم تنفيذه على مشروعك في Supabase (zcpgpaxvszwlzlazlekf):** الجداول وعزل البيانات ومساحة ملفات PDF ودالتا `notify` و`advisor` والجدولة الساعية، وبيانات الاتصال مضبوطة داخل `index.html`. المتبقي فقط:

1. **المستشار:** Supabase ← Edge Functions ← Secrets ← أضف `ANTHROPIC_API_KEY` (من console.anthropic.com).
2. **الإيميل:** أضف أسرار `RESEND_API_KEY` و`MAIL_FROM` و`CRON_SECRET` بالقيمة `8baecbb32c3d6f55df0eb6c54f12c25830e4797e` (نفس المضبوطة في الجدولة).
3. **Authentication ← URL Configuration:** ضع رابط موقعك في Site URL، ولو عايز دخول فوري بدون تأكيد بريد عطّل Confirm email.
4. استضف `index.html` (Netlify/Vercel/GitHub Pages)، وللـ APK شغّل GitHub Actions كما في القسم 5.

---
(الشرح التفصيلي القديم للإعداد اليدوي ما زال أدناه للرجوع إليه.)

# المحامي الذكي: خطوات التشغيل (حوالي 15 دقيقة)

## 1) قاعدة البيانات
1. أنشئ مشروعاً مجانياً على supabase.com.
2. SQL Editor ← الصق محتوى `supabase/schema.sql` ← Run. (هذا ينشئ الجدول ويفعّل العزل: كل مستخدم يرى بياناته فقط.)
3. Authentication ← Providers ← Email: فعّله. اترك "Confirm email" مفعّلاً. Authentication ← URL Configuration: ضع رابط موقعك في Site URL.

## 2) ربط الصفحة
في `index.html` غيّر `SUPABASE_URL` و`SUPABASE_ANON_KEY` (من Project Settings ← API). المفتاح العام anon آمن للنشر، ولا تضع مفتاح service_role هنا أبداً.

## 3) البريد (التنبيهات + نسخة البيانات)
1. أنشئ حساباً على resend.com وتحقق من نطاقك، وخذ API Key.
2. من مجلد المشروع:
```
supabase link --project-ref YOUR_REF
supabase secrets set RESEND_API_KEY=re_xxx MAIL_FROM="المحامي الذكي <no-reply@yourdomain.com>" CRON_SECRET=اختر_كلمة_طويلة APP_TZ=Africa/Cairo
supabase functions deploy notify --no-verify-jwt
```
3. جدولة التنبيهات كل ساعة (SQL Editor، بعد تفعيل إضافتي pg_cron و pg_net من Database ← Extensions):
```
select cron.schedule('session-reminders','0 * * * *',$$
 select net.http_post(
  url:='https://YOUR_REF.supabase.co/functions/v1/notify?mode=reminders',
  headers:='{"x-cron-secret":"نفس_CRON_SECRET"}'::jsonb);
$$);
```

## 3.5) المستشار القانوني
1. خذ مفتاحاً من console.anthropic.com.
2. نفّذ:
```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
supabase functions deploy advisor --no-verify-jwt
```
(الدالة تتحقق من تسجيل الدخول بنفسها، وتحدّ كل مستخدم بـ30 سؤالاً في الساعة. غيّر الحد بـ HOURLY_LIMIT والنموذج بـ ANTHROPIC_MODEL.)

## 4) النشر
ارفع `index.html` على أي استضافة ثابتة (Netlify أو Vercel أو GitHub Pages أو Cloudflare Pages) وافتح الرابط.

ملاحظة: بدون نطاق موثّق في Resend لن تصل الرسائل إلا لبريدك أنت (قيد من Resend، لا من التطبيق).

## 5) نسخة الأندرويد (APK) ونسخة الويب
- **الويب:** بعد النشر افتح الرابط من كروم على الموبايل ← "إضافة إلى الشاشة الرئيسية" فيعمل كتطبيق (PWA).
- **APK:** ارفع محتويات هذا المجلد كما هي إلى مستودع GitHub خاص، ثم Actions ← Build Android APK ← Run workflow. بعد 5 دقائق نزّل `smart-lawyer-apk` وفيه `app-debug.apk` للتثبيت المباشر. اكتب رابط موقعك في `WEB_URL` داخل `index.html` قبل الرفع.
- تنبيهات الـ APK تعمل كإشعارات محلية على الجهاز بدون إنترنت، إضافة إلى رسائل الإيميل.
- للنشر على Google Play تحتاج توقيعاً رسمياً (release)، والـ debug APK مناسب للتوزيع المباشر.
