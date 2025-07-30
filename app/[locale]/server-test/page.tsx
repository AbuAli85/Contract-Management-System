export default async function ServerTestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Server Test Page</h1>
        <p className="text-muted-foreground">Testing server-side rendering</p>
      </div>

      <div className="text-center">
        <p>Locale: {locale}</p>
        <p>Server component working!</p>
      </div>
    </div>
  )
}
