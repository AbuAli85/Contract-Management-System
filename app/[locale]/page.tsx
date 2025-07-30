export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="mx-auto max-w-4xl text-5xl font-bold text-gray-900">
              Transform Your Contract Management with
              <span className="text-blue-600"> Modern UI/UX</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              Experience the beautiful new interface that replaces the old basic CRM system.
              Professional, engaging, and user-friendly design for both admins and promoters.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`/${locale}/auth/login`}
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Get Started
            </a>
            <a
              href={`/${locale}/auth/signup`}
              className="inline-block rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
            >
              Sign Up
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 text-center shadow-md transition-shadow hover:shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Smart Contract Management</h3>
            <p className="text-gray-600">
              Advanced contract generation, editing, and tracking with beautiful interfaces
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 text-center shadow-md transition-shadow hover:shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Promoter CRM</h3>
            <p className="text-gray-600">
              Professional promoter management with analytics, tasks, and performance tracking
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 text-center shadow-md transition-shadow hover:shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Analytics & Insights</h3>
            <p className="text-gray-600">
              Real-time dashboards with KPI tracking and performance analytics
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-8">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-6 text-lg text-gray-600">
              Experience the beautiful new UI/UX that makes contract management engaging and
              professional
            </p>
            <a
              href={`/${locale}/auth/login`}
              className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg text-white transition-colors hover:bg-blue-700"
            >
              Start Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
