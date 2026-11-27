# آسان‌کار

لندینگ «کار بسته‌بندی در منزل» و پنل مدیریت Telegram Mini App.

```bash
npm run dev
```

پیش از انتشار، در `src/lib/site.ts` دامنه، تلفن، ایمیل و نرخ پایه را با اطلاعات واقعی عوض کنید. درخواست‌های فرم در `data/applications.jsonl` ذخیره می‌شود.

## نصب روی سرور

```bash
curl -fsSL https://raw.githubusercontent.com/miladgiotin074/assankar/main/deploy.sh -o deploy.sh
sudo bash deploy.sh example.com
```

اسکریپت هنگام نصب/به‌روزرسانی، توکن بات تلگرام و آی‌دی عددی ادمین را می‌پرسد و در `.env.production` ست می‌کند.

## پنل مدیریت Mini App

مسیر: `/admin`  
کتابخانه: `@tma.js/sdk` و `@tma.js/sdk-react`

### متغیرهای محیطی

روی سرور توسط `deploy.sh` ست می‌شود. برای توسعه محلی در `.env.local` (کامیت نشود):

```env
BOT_TOKEN=123456:ABC...
ADMIN_TELEGRAM_IDS=111111111,222222222
ADMIN_SESSION_SECRET=یک-رمز-قوی-جدا
AUTH_SECRET=همان-رمز-سشن-کاربر
ADMIN_DEV_BYPASS=1
NEXT_PUBLIC_ADMIN_MOCK_ID=111111111
```

- `BOT_TOKEN`: توکن بات از BotFather برای اعتبارسنجی `initData`
- `ADMIN_TELEGRAM_IDS`: آی‌دی عددی تلگرام ادمین‌ها (با کاما)
- در development بدون توکن، با `ADMIN_DEV_BYPASS=1` و mock می‌توان پنل را در مرورگر تست کرد؛ آی‌دی mock باید داخل وایت‌لیست باشد
- در BotFather آدرس Mini App را روی `https://your-domain/admin` بگذارید
