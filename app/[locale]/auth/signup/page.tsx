"use client"

import { SignupForm } from "@/auth/forms/signup-form"
import { OAuthButtons } from "@/auth/forms/oauth-buttons"
import Link from "next/link"

export default function SignupPage() {
  // Get current locale for links
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const locale = pathname.split("/")[1] || "en"
  
  return (
    <div className="w-full max-w-md space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href={"/" + locale + "/auth/login"}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <SignupForm />

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <OAuthButtons />
          </div>
        </div>
      </div>
    </div>
  )
}
