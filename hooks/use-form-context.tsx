"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface FormContextType {
  isFormActive: boolean
  setFormActive: (active: boolean) => void
  registerForm: () => void
  unregisterForm: () => void
  formCount: number
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <FormContext.Provider
      value={{
        isFormActive,
        setFormActive,
        registerForm,
        unregisterForm,
        formCount,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    // Return a safe default for SSR instead of throwing an error
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
    // Only register on the client side
    if (typeof window !== "undefined") {
      registerForm()
      return () => {
        unregisterForm()
      }
    }
  }, [registerForm, unregisterForm])
}
