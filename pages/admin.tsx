import { useRouter } from "next/router"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication and role on client side
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check-session")
        const data = await response.json()

        if (!data.success || !data.hasSession) {
          router.replace("/auth/login")
          return
        }

        // Check if user has admin role
        const roleResponse = await fetch("/api/auth/get-user-role")
        const roleData = await roleResponse.json()

        if (!roleData.success || roleData.role !== "admin") {
          router.replace("/not-authorized")
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.replace("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) return <div>Loading...</div>
  return <div>Welcome, admin!</div>
}
