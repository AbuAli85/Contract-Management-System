export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-accent">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-bold text-card-foreground">
              Welcome to Your
              <span className="text-primary"> Contract Management System</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Manage contracts, promoters, and parties with our professional and user-friendly interface.
              Everything you need for efficient contract management in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={"/" + locale + "/dashboard"}
              className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to Dashboard
            </a>
            <a
              href={"/" + locale + "/generate-contract"}
              className="inline-block rounded-lg bg-secondary px-6 py-3 text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Generate Contract
            </a>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Smart Contract Management</h3>
            <p className="text-muted-foreground mb-4">
              Advanced contract generation, editing, and tracking with beautiful interfaces
            </p>
            <a
              href={"/" + locale + "/contracts"}
              className="inline-block rounded-lg bg-primary/10 px-4 py-2 text-primary transition-colors hover:bg-primary/20"
            >
              View Contracts
            </a>
          </div>

          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Promoter Management</h3>
            <p className="text-muted-foreground mb-4">
              Professional promoter management with analytics, tasks, and performance tracking
            </p>
            <a
              href={"/" + locale + "/manage-promoters"}
              className="inline-block rounded-lg bg-success/10 px-4 py-2 text-success transition-colors hover:bg-success/20"
            >
              Manage Promoters
            </a>
          </div>

          <div className="rounded-lg bg-card p-6 text-center shadow-md transition-shadow hover:shadow-lg border border-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">Analytics & Insights</h3>
            <p className="text-muted-foreground mb-4">
              Real-time dashboards with KPI tracking and performance analytics
            </p>
            <a
              href={"/" + locale + "/dashboard/analytics"}
              className="inline-block rounded-lg bg-accent/10 px-4 py-2 text-accent-foreground transition-colors hover:bg-accent/20"
            >
              View Analytics
            </a>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-lg bg-card p-6 shadow-md border border-border">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href={"/" + locale + "/manage-parties"}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <span>Manage Parties</span>
                <span className="text-sm text-muted-foreground">→</span>
              </a>
              <a
                href={"/" + locale + "/crm"}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <span>CRM Dashboard</span>
                <span className="text-sm text-muted-foreground">→</span>
              </a>
              <a
                href={"/" + locale + "/notifications"}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <span>Notifications</span>
                <span className="text-sm text-muted-foreground">→</span>
              </a>
            </div>
          </div>

          <div className="rounded-lg bg-card p-6 shadow-md border border-border">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span>System Online</span>
                <span className="text-green-600">●</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <span>Database Connected</span>
                <span className="text-blue-600">●</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <span>Updates Available</span>
                <span className="text-yellow-600">●</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
