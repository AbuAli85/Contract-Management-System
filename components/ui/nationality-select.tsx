"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SORTED_NATIONALITIES } from "@/lib/nationalities"

interface NationalitySelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function NationalitySelect({
  value,
  onValueChange,
  placeholder = "Select nationality...",
  disabled = false
}: NationalitySelectProps) {
  const [open, setOpen] = useState(false)

  const selectedNationality = SORTED_NATIONALITIES.find(
    (nationality) => nationality.value === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedNationality ? selectedNationality.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search nationality..." />
          <CommandList>
            <CommandEmpty>No nationality found.</CommandEmpty>
            <CommandGroup>
              {SORTED_NATIONALITIES.map((nationality) => (
                <CommandItem
                  key={nationality.value}
                  value={nationality.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === nationality.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {nationality.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 