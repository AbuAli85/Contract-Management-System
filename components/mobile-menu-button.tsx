"use client"

import React from "react"

interface MobileMenuButtonProps {
  isOpen: boolean
  onToggle: () => void
}

export function MobileMenuButton({ isOpen, onToggle }: MobileMenuButtonProps) {
  const handleToggle = () => {
    console.log("🧭 MobileMenuButton: Toggling sidebar", { isOpen: !isOpen })
    onToggle()
  }

  return (
    <button
      onClick={handleToggle}
      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle menu"
    >
      <div className="flex h-6 w-6 flex-col items-center justify-center">
        <span
          className={`block h-0.5 w-5 transform bg-current transition duration-300 ${isOpen ? "translate-y-1 rotate-45" : "-translate-y-1"}`}
        ></span>
        <span
          className={`block h-0.5 w-5 bg-current transition duration-300 ${isOpen ? "opacity-0" : "opacity-100"}`}
        ></span>
        <span
          className={`block h-0.5 w-5 transform bg-current transition duration-300 ${isOpen ? "-translate-y-1 -rotate-45" : "translate-y-1"}`}
        ></span>
      </div>
    </button>
  )
}
