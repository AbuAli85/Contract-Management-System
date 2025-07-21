export async function generateStaticParams() {
  const { i18n } = await import('@/src/i18n/i18n-config')
  return i18n.locales.map((locale) => ({ locale }))
}
