import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { UniversalLayout } from '@/components/universal-layout';
import { HtmlDirUpdater } from '@/components/html-dir-updater';
import { getDirection, getFontFamily } from '@/lib/i18n/rtl';

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }];
}

export default async function SafeLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locale || !['en', 'ar'].includes(locale)) {
    console.error('Invalid locale:', locale);
    return (
      <div className='p-4 text-red-600'>
        <h1>Invalid locale</h1>
        <p>The requested locale &quot;{locale}&quot; is not supported.</p>
      </div>
    );
  }

  // Set the request locale FIRST to enable static rendering
  setRequestLocale(locale);

  // Load translation messages
  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;

  // Get RTL/LTR direction and font
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);

  // Note: Do NOT render <html> and <body> here - they are in the root layout
  // The root layout provides the Providers context (AuthProvider, etc.)
  // Rendering nested html/body tags breaks the React context tree
  return (
    <div dir={direction} className={fontFamily}>
      <HtmlDirUpdater locale={locale} />
      <NextIntlClientProvider messages={messages} locale={locale}>
        <UniversalLayout locale={locale}>{children}</UniversalLayout>
      </NextIntlClientProvider>
    </div>
  );
}
