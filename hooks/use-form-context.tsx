"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface FormContextType {
  isFormActive: boolean
  setFormActive: (active: boolean) => void
  registerForm: () => void
  unregisterForm: () => void
  formCount: number
}

// Create context with a default value to prevent initialization errors
const FormContext = createContext<FormContextType>({
  isFormActive: false,
  setFormActive: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
  formCount: 0,
})

export function FormContextProvider({ children }: { children: React.ReactNode }) {
  const [formCount, setFormCount] = useState(0)
  const [isFormActive, setIsFormActive] = useState(false)

  const registerForm = useCallback(() => {
    setFormCount((prev) => {
      const newCount = prev + 1
      setIsFormActive(newCount > 0)
      return newCount
    })
  }, [])

  const unregisterForm = useCallback(() => {
    setFormCount((prev) => {
      const newCount = Math.max(0, prev - 1)
      setIsFormActive(newCount > 0)
      return newCount
    })
  }, [])

  const setFormActive = useCallback((active: boolean) => {
    setIsFormActive(active)
  }, [])

  const contextValue: FormContextType = {
    isFormActive,
    setFormActive,
    registerForm,
    unregisterForm,
    formCount,
  }

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  
  // Additional safety check for SSR
  if (typeof window === "undefined") {
    return {
      isFormActive: false,
      setFormActive: () => {},
      registerForm: () => {},
      unregisterForm: () => {},
      formCount: 0,
    }
  }
  
  return context
}

// Hook to automatically register/unregister forms
export function useFormRegistration() {
  const { registerForm, unregisterForm } = useFormContext()

  React.useEffect(() => {
    // Only register on the client side and ensure context is available
    if (typeof window !== "undefined" && registerForm && unregisterForm) {
      registerForm()
      return () => {
        unregisterForm()
      }
    }
  }, [registerForm, unregisterForm])
}
