// DISABLED: This component was causing infinite loops and infinite page reloads
"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/src/components/auth/simple-auth-provider"

export function RoleLoader() {
  // This component is disabled to prevent infinite loops
  // The role loading is now handled by the main AuthProvider

  return null
}
