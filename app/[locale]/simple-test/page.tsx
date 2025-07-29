export default function SimpleTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-600">Simple Test Page</h1>
      <p className="mt-4 text-gray-600">This is a simple test page to verify rendering.</p>
      <div className="mt-4 p-4 bg-green-100 rounded">
        <p className="text-green-800">✅ If you can see this, the page is rendering correctly!</p>
      </div>
    </div>
  )
} 