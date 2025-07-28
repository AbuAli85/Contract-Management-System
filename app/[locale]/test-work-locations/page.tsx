"use client"

import { useState } from "react"
import { WORK_LOCATIONS, getWorkLocationDescription } from "@/constants/contract-options"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function TestWorkLocationsPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>("")

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Work Locations Test</h1>
          <p className="text-muted-foreground">
            Test the enhanced Work Location dropdown with descriptions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Location Dropdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Work Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a work location..." />
                </SelectTrigger>
                <SelectContent>
                  {WORK_LOCATIONS.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{location.label}</span>
                        {location.description && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {location.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLocation && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Selected Location:</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Value: </span>
                    <Badge variant="outline">{selectedLocation}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Label: </span>
                    <span>{getOptionLabel(WORK_LOCATIONS, selectedLocation)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Description: </span>
                    <span className="text-muted-foreground">
                      {getWorkLocationDescription(selectedLocation)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Work Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORK_LOCATIONS.map((location) => (
                <div key={location.value} className="p-3 border rounded-lg">
                  <div className="font-medium">{location.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {location.description}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {location.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function to get option label
const getOptionLabel = (
  options: readonly { value: string; label: string; description?: string }[],
  value: string
): string => {
  const option = options.find(opt => opt.value === value)
  return option?.label || value
} 