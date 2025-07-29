'use client'

import React from 'react'

interface MobileMenuButtonProps {
  isOpen: boolean
  onToggle: () => void
}

export function MobileMenuButton({ isOpen, onToggle }: MobileMenuButtonProps) {
  const handleToggle = () => {
    console.log('🧭 MobileMenuButton: Toggling sidebar', { isOpen: !isOpen })
    onToggle()
  }
  
  return (
    <button
      onClick={handleToggle}
      className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      aria-label="Toggle menu"
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span className={`block w-5 h-0.5 bg-current transform transition duration-300 ${isOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
        <span className={`block w-5 h-0.5 bg-current transition duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
        <span className={`block w-5 h-0.5 bg-current transform transition duration-300 ${isOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
      </div>
    </button>
  )
} 