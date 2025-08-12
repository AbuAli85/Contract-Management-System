import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { UniversalLayout } from '@/components/universal-layout';
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
        <p>The requested locale "{locale}" is not supported.</p>
      </div>
    );
  }

  // Set the request locale FIRST to enable static rendering
  setRequestLocale(locale);

  // Use empty messages to avoid dynamic rendering issues
  const messages = {};

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <UniversalLayout locale={locale}>{children}</UniversalLayout>
    </NextIntlClientProvider>
  );
}
