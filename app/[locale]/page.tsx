export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-bold text-card-foreground">
              Transform Your Contract Management with
              <span className="text-primary"> Modern UI/UX</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Experience the beautiful new interface that replaces the old basic CRM system.
              Professional, engaging, and user-friendly design for both admins and promoters.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`/${locale}/auth/login`}
              className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </a>
            <a
              href={`/${locale}/auth/signup`}
              className="inline-block rounded-lg bg-secondary px-6 py-3 text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Sign Up
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Smart Contract Management</h3>
            <p className="text-muted-foreground">
              Advanced contract generation, editing, and tracking with beautiful interfaces
            </p>
          </div>

          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Promoter CRM</h3>
            <p className="text-muted-foreground">
              Professional promoter management with analytics, tasks, and performance tracking
            </p>
          </div>

          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Analytics & Insights</h3>
            <p className="text-muted-foreground">
              Real-time dashboards with KPI tracking and performance analytics
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="rounded-lg border border-border bg-gradient-to-r from-card to-accent p-8">
            <h2 className="mb-4 text-3xl font-bold text-card-foreground">Ready to Get Started?</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Experience the beautiful new UI/UX that makes contract management engaging and
              professional
            </p>
            <a
              href={`/${locale}/auth/login`}
              className="inline-block rounded-lg bg-primary px-8 py-4 text-lg text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
