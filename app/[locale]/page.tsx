export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 max-w-4xl mx-auto">
              Transform Your Contract Management with 
              <span className="text-blue-600"> Modern UI/UX</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the beautiful new interface that replaces the old basic CRM system. 
              Professional, engaging, and user-friendly design for both admins and promoters.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href={`/${locale}/auth/login`} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </a>
            <a href={`/${locale}/auth/signup`} className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              Sign Up
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Contract Management</h3>
            <p className="text-gray-600">
              Advanced contract generation, editing, and tracking with beautiful interfaces
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Promoter CRM</h3>
            <p className="text-gray-600">
              Professional promoter management with analytics, tasks, and performance tracking
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
            <p className="text-gray-600">
              Real-time dashboards with KPI tracking and performance analytics
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Experience the beautiful new UI/UX that makes contract management engaging and professional
            </p>
            <a href={`/${locale}/auth/login`} className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition-colors">
              Start Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
