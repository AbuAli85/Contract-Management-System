export default function EmergencyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">System Status</h1>

        <div className="space-y-4">
          <div className="rounded border border-green-200 bg-green-50 p-4">
            <p className="text-green-800">✅ Basic page rendering is working</p>
          </div>

          <div className="rounded border border-blue-200 bg-blue-50 p-4">
            <p className="text-blue-800">
              🔧 If you're seeing this page, the basic system is functional
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">Quick Actions:</h2>
            <div className="space-y-2">
              <a
                href="/"
                className="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
              >
                Go to Homepage
              </a>
              <a
                href="/debug-system"
                className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-white hover:bg-gray-700"
              >
                Run System Debug
              </a>
              <a
                href="/test-simple"
                className="block w-full rounded bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
              >
                Simple Test Page
              </a>
            </div>
          </div>

          <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">If the system is broken, try:</p>
            <ul className="mt-2 space-y-1 text-sm text-yellow-700">
              <li>• Hard refresh (Ctrl+Shift+R)</li>
              <li>• Clear browser cache</li>
              <li>• Restart development server</li>
              <li>• Check browser console for errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
