"use client"

import * as React from "react"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error("useFormField must be used within a <FormField> component")
  }

  if (!itemContext) {
    throw new Error("useFormField must be used within a <FormItem> component")
  }

  // Check if we're on the client side and have a form context
  if (typeof window === "undefined") {
    // Return safe defaults for SSR
    return {
      id: itemContext.id,
      name: fieldContext.name,
      formItemId: itemContext.id + "-form-item",
      formDescriptionId: itemContext.id + "-form-item-description",
      formMessageId: itemContext.id + "-form-item-message",
      error: undefined,
      formState: { errors: {} },
    }
  }

  try {
    const { getFieldState, formState } = useFormContext()
    const fieldState = getFieldState(fieldContext.name, formState)

    return {
      id: itemContext.id,
      name: fieldContext.name,
      formItemId: itemContext.id + "-form-item",
      formDescriptionId: itemContext.id + "-form-item-description",
      formMessageId: itemContext.id + "-form-item-message",
      ...fieldState,
    }
  } catch (error) {
    // Return safe defaults if form context is not available
    return {
      id: itemContext.id,
      name: fieldContext.name,
      formItemId: itemContext.id + "-form-item",
      formDescriptionId: itemContext.id + "-form-item-description",
      formMessageId: itemContext.id + "-form-item-message",
      error: undefined,
      formState: { errors: {} },
    }
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | undefined>(undefined)

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    )
  },
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  const formField = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(formField.error && "text-destructive", className)}
      htmlFor={formField.formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const formField = useFormField()

  return (
    <div
      ref={ref}
      id={formField.formItemId}
      aria-describedby={!formField.error 
        ? formField.formDescriptionId 
        : `${formField.formDescriptionId} ${formField.formMessageId}`}
      aria-invalid={formField.error ? "true" : undefined}
      {...props}
    >
      {children}
    </div>
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
