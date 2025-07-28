export default function TestBasicPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Basic Test Page</h1>
        <p className="text-lg text-gray-600">
          If you can see this page, the basic Next.js setup is working!
        </p>
        <div className="mt-8 space-y-2">
          <a 
            href="/en/auth/login" 
            className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login Page
          </a>
          <a 
            href="/test-auth-simple" 
            className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Auth Test Page
          </a>
        </div>
      </div>
    </div>
  );
} 