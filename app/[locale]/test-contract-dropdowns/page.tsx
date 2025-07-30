"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { JOB_TITLES, DEPARTMENTS, WORK_LOCATIONS } from "@/constants/contract-options"

// Force dynamic rendering to prevent SSR issues
export const dynamic = "force-dynamic"

export default function TestContractDropdownsPage() {
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>("")

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Contract Form Dropdown Test</h1>
          <p className="text-muted-foreground">
            Verify that Job Title, Department, and Work Location fields are working as dropdown
            lists
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Job Title</label>
                <Select value={selectedJobTitle} onValueChange={setSelectedJobTitle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLES.map((title) => (
                      <SelectItem key={title.value} value={title.value}>
                        {title.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedJobTitle && (
                  <p className="mt-1 text-xs text-muted-foreground">Selected: {selectedJobTitle}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDepartment && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selected: {selectedDepartment}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Work Location</label>
                <Select value={selectedWorkLocation} onValueChange={setSelectedWorkLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_LOCATIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{location.label}</span>
                          {location.description && (
                            <span className="mt-0.5 text-xs text-muted-foreground">
                              {location.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWorkLocation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Selected: {selectedWorkLocation}
                  </p>
                )}
              </div>
            </div>

            {(selectedJobTitle || selectedDepartment || selectedWorkLocation) && (
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-semibold">Selected Values:</h3>
                <div className="space-y-2">
                  {selectedJobTitle && (
                    <div>
                      <span className="font-medium">Job Title: </span>
                      <Badge variant="outline">{selectedJobTitle}</Badge>
                    </div>
                  )}
                  {selectedDepartment && (
                    <div>
                      <span className="font-medium">Department: </span>
                      <Badge variant="outline">{selectedDepartment}</Badge>
                    </div>
                  )}
                  {selectedWorkLocation && (
                    <div>
                      <span className="font-medium">Work Location: </span>
                      <Badge variant="outline">{selectedWorkLocation}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Job Titles ({JOB_TITLES.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {JOB_TITLES.map((title) => (
                  <div key={title.value} className="rounded border p-2">
                    <div className="font-medium">{title.label}</div>
                    <Badge variant="secondary" className="text-xs">
                      {title.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departments ({DEPARTMENTS.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept.value} className="rounded border p-2">
                    <div className="font-medium">{dept.label}</div>
                    <Badge variant="secondary" className="text-xs">
                      {dept.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Locations ({WORK_LOCATIONS.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {WORK_LOCATIONS.map((location) => (
                  <div key={location.value} className="rounded border p-2">
                    <div className="font-medium">{location.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{location.description}</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {location.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Job Title Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Department Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Work Location Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Work Location Descriptions:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>New Sales Job Titles:</span>
                <Badge variant="default">✅ Added</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
