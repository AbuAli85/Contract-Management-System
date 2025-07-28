export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          System Status
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800">
              ✅ Basic page rendering is working
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">
              🔧 If you're seeing this page, the basic system is functional
            </p>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-semibold">Quick Actions:</h2>
            <div className="space-y-2">
              <a 
                href="/" 
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
              >
                Go to Homepage
              </a>
              <a 
                href="/debug-system" 
                className="block w-full px-4 py-2 bg-gray-600 text-white text-center rounded hover:bg-gray-700"
              >
                Run System Debug
              </a>
              <a 
                href="/test-simple" 
                className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded hover:bg-green-700"
              >
                Simple Test Page
              </a>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              If the system is broken, try:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
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