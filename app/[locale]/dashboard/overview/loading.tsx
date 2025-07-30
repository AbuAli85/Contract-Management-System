import { Loader2 } from "lucide-react"

export default function DashboardOverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </div>
            <div className="mb-1 h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-10 w-10 animate-pulse rounded bg-muted" />
                <div className="h-5 w-12 animate-pulse rounded bg-muted" />
              </div>
              <div className="mb-2 h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="mb-4 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard overview...</span>
      </div>
    </div>
  )
}
