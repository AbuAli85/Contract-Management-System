"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"

// Performance optimization component
export function PerformanceOptimizer() {
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") return

    // Load fonts as stylesheets instead of preload
    const loadFonts = () => {
      const fontLinks = [
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      ]

      fontLinks.forEach((href) => {
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement("link")
          link.rel = "stylesheet" // Use stylesheet instead of preload
          link.href = href
          document.head.appendChild(link)
        }
      })
    }

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll("img")
      images.forEach((img) => {
        if (!img.hasAttribute("loading")) {
          img.loading = "lazy"
        }
        if (!img.hasAttribute("decoding")) {
          img.decoding = "async"
        }
      })
    }

    // Preconnect to external domains
    const preconnectDomains = () => {
      const domains = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]

      domains.forEach((domain) => {
        if (!document.querySelector(`link[href="${domain}"]`)) {
          const link = document.createElement("link")
          link.rel = "preconnect"
          link.href = domain
          document.head.appendChild(link)
        }
      })
    }

    loadFonts()
    optimizeImages()
    preconnectDomains()
  }, [])

  return null
}

// Dynamic imports for better code splitting
export const DynamicComponent = {
  // Dynamically import heavy components
  Dashboard: dynamic(() => import("./dashboard/dashboard-content"), {
    loading: () => <div>Loading dashboard...</div>,
    ssr: false,
  }),

  ContractsTable: dynamic(() => import("./contracts/ContractsTable"), {
    loading: () => <div>Loading contracts...</div>,
    ssr: false,
  }),

  // Add more dynamic imports as needed
}
