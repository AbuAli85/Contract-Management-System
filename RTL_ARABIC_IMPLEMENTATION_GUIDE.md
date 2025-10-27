# RTL & Arabic Bilingual Implementation Guide

**Date:** October 27, 2025  
**Priority:** HIGH  
**Status:** IN PROGRESS

## Executive Summary

The SmartPro Promoters Portal has basic Arabic (ar) locale support configured but requires comprehensive RTL (Right-to-Left) layout implementation and complete translation coverage.

---

## ✅ What's Already Working

- next-intl configured with `en` and `ar` locales
- Message files exist: `i18n/messages/ar.json` and `i18n/messages/en.json`
- Routing configured to support locale prefixes (`/en/*`, `/ar/*`)
- `tailwindcss-rtl` plugin installed

---

## ❌ What Needs To Be Fixed

### 1. RTL Layout Implementation

#### Current Issues:
- No automatic direction switching based on locale
- Layouts don't flip for RTL languages
- Icons and UI elements maintain LTR positions
- Margins and padding don't flip

#### Implementation:

**Add Direction to HTML Tag:**
```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head />
      <body className={cn(
        isRTL && 'font-arabic', // Use Arabic font
      )}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Add RTL-Aware Tailwind Classes:**
```tsx
// Use logical properties that automatically flip
<div className="ms-4 me-auto"> {/* margin-inline-start, margin-inline-end */}
<div className="ps-6 pe-4">    {/* padding-inline-start, padding-inline-end */}
<div className="start-0">       {/* left in LTR, right in RTL */}
<div className="end-0">         {/* right in LTR, left in RTL */}

// Before (LTR only):
<div className="ml-4 mr-auto text-left">

// After (RTL-aware):
<div className="ms-4 me-auto text-start">
```

**Configure Tailwind for RTL:**
```js
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
    // ... other plugins
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
};
```

**Load Arabic Fonts:**
```tsx
// app/[locale]/layout.tsx
import { Cairo } from 'next/font/google';

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-arabic',
});

export default function RootLayout({ children, params }: Props) {
  return (
    <html 
      lang={params.locale} 
      dir={params.locale === 'ar' ? 'rtl' : 'ltr'}
      className={cairo.variable}
    >
      {/* ... */}
    </html>
  );
}
```

---

### 2. Component-Level RTL Support

**Navigation & Sidebar:**
```tsx
// components/sidebar.tsx
import { useLocale } from 'next-intl';

export function Sidebar() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <aside className={cn(
      "fixed top-0 h-screen w-64 border-gray-200 bg-white",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )}>
      {/* Sidebar content */}
    </aside>
  );
}
```

**Icons That Should Flip:**
```tsx
// components/ui/icon-wrapper.tsx
export function IconWrapper({ 
  icon: Icon, 
  flipRTL = false,
  className 
}: IconWrapperProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <Icon 
      className={cn(
        className,
        flipRTL && isRTL && 'scale-x-[-1]' // Flip horizontally
      )} 
    />
  );
}

// Usage:
<IconWrapper icon={ArrowRight} flipRTL /> // Flips for RTL
<IconWrapper icon={ChevronLeft} flipRTL /> // Flips for RTL
<IconWrapper icon={User} /> // Doesn't flip (symmetrical)
```

**Breadcrumbs:**
```tsx
// components/breadcrumbs.tsx
const Separator = ({ isRTL }: { isRTL: boolean }) => (
  isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
);

<nav className="flex" aria-label="Breadcrumb">
  {items.map((item, index) => (
    <React.Fragment key={item.href}>
      <Link href={item.href}>{item.label}</Link>
      {index < items.length - 1 && <Separator isRTL={isRTL} />}
    </React.Fragment>
  ))}
</nav>
```

**Forms:**
```tsx
// Ensure labels align correctly
<div className="space-y-2">
  <Label className="text-start">{t('firstName')}</Label>
  <Input type="text" className="text-start" dir="auto" />
</div>

// Grouped inputs (e.g., phone number with country code)
<div className={cn(
  "flex gap-2",
  isRTL ? "flex-row-reverse" : "flex-row"
)}>
  <Select>...</Select>
  <Input />
</div>
```

---

### 3. Complete Translation Coverage

#### Translation Checklist:

**Core UI Elements:**
```json
// i18n/messages/ar.json
{
  "common": {
    "dashboard": "لوحة التحكم",
    "promoters": "المروجون",
    "contracts": "العقود",
    "save": "حفظ",
    "cancel": "إلغاء",
    "edit": "تعديل",
    "delete": "حذف",
    "add": "إضافة",
    "search": "بحث",
    "filter": "تصفية",
    "export": "تصدير",
    "import": "استيراد"
  },
  "navigation": {
    "home": "الرئيسية",
    "contracts": "العقود",
    "promoters": "المروجون",
    "analytics": "التحليلات",
    "settings": "الإعدادات",
    "logout": "تسجيل الخروج"
  },
  "metrics": {
    "totalContracts": "إجمالي العقود",
    "activeContracts": "العقود النشطة",
    "workforce": "القوى العاملة",
    "utilization": "معدل الاستخدام",
    "complianceRate": "معدل الامتثال"
  },
  "status": {
    "active": "نشط",
    "inactive": "غير نشط",
    "pending": "قيد الانتظار",
    "expired": "منتهي الصلاحية",
    "available": "متاح",
    "onLeave": "في إجازة"
  },
  "forms": {
    "promoters": {
      "addNew": "إضافة مروج جديد",
      "firstName": "الاسم الأول",
      "lastName": "اسم العائلة",
      "email": "البريد الإلكتروني",
      "phone": "رقم الهاتف",
      "idNumber": "رقم الهوية",
      "passportNumber": "رقم جواز السفر",
      "required": "هذا الحقل مطلوب",
      "invalidEmail": "البريد الإلكتروني غير صالح"
    }
  },
  "messages": {
    "success": {
      "saved": "تم الحفظ بنجاح",
      "deleted": "تم الحذف بنجاح",
      "updated": "تم التحديث بنجاح"
    },
    "error": {
      "saveFailed": "فشل الحفظ",
      "loadFailed": "فشل التحميل",
      "networkError": "خطأ في الشبكة"
    }
  }
}
```

**Use Translations in Components:**
```tsx
import { useTranslations } from 'next-intl';

export function DashboardPage() {
  const t = useTranslations('common');
  const tMetrics = useTranslations('metrics');

  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard 
          label={tMetrics('totalContracts')} 
          value={metrics.total} 
        />
        <MetricCard 
          label={tMetrics('activeContracts')} 
          value={metrics.active} 
        />
      </div>
    </div>
  );
}
```

**Pluralization:**
```json
// en.json
{
  "items": {
    "promoter": "{count, plural, =0 {No promoters} one {# promoter} other {# promoters}}"
  }
}

// ar.json
{
  "items": {
    "promoter": "{count, plural, =0 {لا يوجد مروجون} one {مروج واحد} two {مروجان} few {# مروجين} many {# مروجًا} other {# مروج}}"
  }
}
```

```tsx
// Usage:
const t = useTranslations('items');
<p>{t('promoter', { count: promoters.length })}</p>
```

**Date/Number Formatting:**
```tsx
import { useFormatter, useLocale } from 'next-intl';

export function FormattedData() {
  const format = useFormatter();
  const locale = useLocale();

  return (
    <div>
      {/* Date formatting */}
      <p>{format.dateTime(new Date(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>

      {/* Number formatting */}
      <p>{format.number(1234567.89, {
        style: 'currency',
        currency: locale === 'ar' ? 'SAR' : 'USD'
      })}</p>

      {/* Relative time */}
      <p>{format.relativeTime(new Date('2024-01-01'))}</p>
    </div>
  );
}
```

---

### 4. Language Switcher

**Add Language Switcher Component:**
```tsx
// components/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Replace the locale in the pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    const newPath = segments.join('/');
    
    router.push(newPath);
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]">
        <Languages className="h-4 w-4 me-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### 5. Testing RTL Layout

**Visual Testing Checklist:**
```markdown
- [ ] Header: Logo and menu items flip correctly
- [ ] Sidebar: Appears on right side in RTL, icons flip appropriately
- [ ] Navigation: Breadcrumbs show correct separator direction
- [ ] Cards: Content aligns to start (right in RTL)
- [ ] Forms: Labels and inputs align correctly
- [ ] Tables: Columns maintain logical order
- [ ] Charts: Legends and labels position correctly
- [ ] Modals: Close button positioned correctly (top-left in RTL)
- [ ] Tooltips: Appear on correct side
- [ ] Dropdowns: Align with trigger element correctly
```

**Automated RTL Testing:**
```tsx
// __tests__/rtl.test.tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

describe('RTL Support', () => {
  it('should set dir="rtl" for Arabic locale', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <div data-testid="content">Content</div>
      </NextIntlClientProvider>
    );
    
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('should flip layout classes for RTL', () => {
    // Test that margins/padding flip
    // Test that icons flip
    // Test that text aligns to end
  });
});
```

---

## 📋 Implementation Checklist

### Phase 1: Core RTL Support (Week 1)
- [x] Configure next-intl with ar locale ✅ Already done
- [ ] Add `dir` attribute to HTML based on locale
- [ ] Load Arabic fonts (Cairo or Tajawal)
- [ ] Replace all `ml-*`, `mr-*`, `pl-*`, `pr-*` with logical properties
- [ ] Add language switcher to header

### Phase 2: Component RTL Adaptation (Week 2)
- [ ] Update Sidebar to position correctly for RTL
- [ ] Flip directional icons (arrows, chevrons)
- [ ] Fix breadcrumb separators
- [ ] Ensure forms align correctly
- [ ] Test tables in RTL mode

### Phase 3: Complete Translation (Week 2-3)
- [ ] Translate all common UI strings
- [ ] Translate navigation labels
- [ ] Translate form labels and validation messages
- [ ] Translate dashboard metrics
- [ ] Translate status labels
- [ ] Translate error/success messages

### Phase 4: Testing & Polish (Week 3)
- [ ] Visual testing on all major pages
- [ ] Test language switching functionality
- [ ] Verify date/number formatting
- [ ] Check pluralization rules
- [ ] Performance testing with Arabic fonts
- [ ] Accessibility testing in RTL mode

---

## 🎯 Success Criteria

- [ ] All text content has Arabic translations
- [ ] Layout flips correctly for RTL
- [ ] All components render correctly in Arabic
- [ ] Language switcher works on all pages
- [ ] Dates, numbers, currencies format correctly
- [ ] No layout breaks or overlapping in RTL
- [ ] Performance is comparable to LTR
- [ ] Accessibility maintained in RTL mode

---

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [RTL Styling Best Practices](https://rtlstyling.com/)
- [Arabic Typography Guidelines](https://material.io/design/communication/language-support.html#arabic)
- [Tailwind RTL Plugin](https://github.com/20lives/tailwindcss-rtl)

---

## Common Pitfalls to Avoid

1. **Don't flip symmetrical icons** (User, Settings, etc.)
2. **Do flip directional icons** (Arrows, Chevrons, etc.)
3. **Don't use `float: left/right`** - use logical properties
4. **Test with real Arabic content**, not just RTL English
5. **Remember pluralization** - Arabic has 6 plural forms
6. **Test forms thoroughly** - validation messages must be translated
7. **Check z-index stacking** - RTL can affect layering
8. **Verify currency formatting** - Different currencies in different locales

