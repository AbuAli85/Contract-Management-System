export default async function SidebarDebugPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">🐛 Sidebar Debug Page</h1>
        <p className="text-muted-foreground">Debugging sidebar navigation issues</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-800">Debug Information:</h2>
        <ul className="space-y-2 text-sm text-red-700">
          <li>• <strong>Current URL:</strong> /{locale}/sidebar-debug</li>
          <li>• <strong>Expected Sidebar:</strong> Should be visible on the left</li>
          <li>• <strong>Mobile Menu:</strong> Should show hamburger button</li>
          <li>• <strong>Debug Logs:</strong> Check browser console for 🧭 logs</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">Troubleshooting:</h2>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li>• If sidebar is not visible, check console for errors</li>
          <li>• If loading spinner persists, auth might be stuck</li>
          <li>• Try refreshing the page</li>
          <li>• Check network tab for failed requests</li>
        </ul>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          This page should show the sidebar navigation. If you don't see it, there's an issue.
        </p>
      </div>
    </div>
  )
} 