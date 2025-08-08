"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const SelectContext = React.createContext<SelectContextType>({})

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const Select: React.FC<SelectProps> = ({ children, value, onValueChange, disabled }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange, disabled }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { disabled } = React.useContext(SelectContext)
    const [isOpen, setIsOpen] = React.useState(false)
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  placeholder?: string
  className?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  const { value } = React.useContext(SelectContext)
  
  return (
    <span className={cn("block truncate", className)}>
      {value || placeholder}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
  position?: "item-aligned" | "popper"
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className, position = "popper" }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          position === "popper" && "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

interface SelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
    const isSelected = selectedValue === value
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          isSelected && "bg-accent text-accent-foreground",
          className
        )}
        onClick={() => onValueChange?.(value)}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <span className="h-2 w-2 rounded-full bg-current" />}
        </span>
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

interface SelectLabelProps {
  children: React.ReactNode
  className?: string
}

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ children, className }, ref) => (
    <div
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    >
      {children}
    </div>
  )
)
SelectLabel.displayName = "SelectLabel"

interface SelectSeparatorProps {
  className?: string
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
    />
  )
)
SelectSeparator.displayName = "SelectSeparator"

// Additional components for compatibility
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
)

const SelectScrollUpButton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex cursor-default items-center justify-center py-1", className)}>
    <ChevronDown className="h-4 w-4 rotate-180" />
  </div>
)

const SelectScrollDownButton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex cursor-default items-center justify-center py-1", className)}>
    <ChevronDown className="h-4 w-4" />
  </div>
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}