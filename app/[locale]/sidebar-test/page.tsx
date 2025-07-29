export default async function SidebarTestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600">🧭 Sidebar Navigation Test</h1>
        <p className="text-muted-foreground">Testing the new sidebar navigation system</p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Sidebar is working!</p>
          <p className="text-green-600 text-sm">Check the left side for the navigation menu</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sidebar Features:</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Responsive Design:</strong> Works on desktop and mobile</li>
          <li>✅ <strong>Mobile Menu:</strong> Hamburger button for mobile devices</li>
          <li>✅ <strong>All Pages:</strong> Complete navigation to all features</li>
          <li>✅ <strong>User Info:</strong> Shows logged-in user information</li>
          <li>✅ <strong>Smooth Animations:</strong> Smooth open/close transitions</li>
          <li>✅ <strong>Auto-close:</strong> Closes on mobile after navigation</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Pages:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">📊 Dashboard</h3>
            <p className="text-sm text-gray-600">Main overview and analytics</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">📄 Generate Contract</h3>
            <p className="text-sm text-gray-600">Create new contracts</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">📋 Contracts</h3>
            <p className="text-sm text-gray-600">View all contracts</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">👥 Manage Parties</h3>
            <p className="text-sm text-gray-600">Manage contract parties</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">🎯 Manage Promoters</h3>
            <p className="text-sm text-gray-600">Manage promoters</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">📈 Promoter Analysis</h3>
            <p className="text-sm text-gray-600">Analytics and reports</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Try navigating using the sidebar on the left! 
          On mobile, use the hamburger menu button.
        </p>
      </div>
    </div>
  )
} 