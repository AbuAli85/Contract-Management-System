export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Contract Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the contract management system
        </p>
        <div className="space-x-4">
          <a 
            href="/en" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </a>
          <a 
            href="/en/auth/login" 
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  )
}
