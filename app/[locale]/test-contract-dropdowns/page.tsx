"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { JOB_TITLES, DEPARTMENTS, WORK_LOCATIONS } from "@/constants/contract-options"

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function TestContractDropdownsPage() {
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>("")

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Contract Form Dropdown Test</h1>
          <p className="text-muted-foreground">
            Verify that Job Title, Department, and Work Location fields are working as dropdown lists
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Job Title</label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedJobTitle}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedDepartment}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Work Location</label>
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
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {location.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWorkLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedWorkLocation}
                  </p>
                )}
              </div>
            </div>

            {(selectedJobTitle || selectedDepartment || selectedWorkLocation) && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Selected Values:</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Titles ({JOB_TITLES.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {JOB_TITLES.map((title) => (
                  <div key={title.value} className="p-2 border rounded">
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept.value} className="p-2 border rounded">
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {WORK_LOCATIONS.map((location) => (
                  <div key={location.value} className="p-2 border rounded">
                    <div className="font-medium">{location.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {location.description}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
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
              <div className="flex justify-between items-center">
                <span>Job Title Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Department Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Work Location Dropdown:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Work Location Descriptions:</span>
                <Badge variant="default">✅ Implemented</Badge>
              </div>
              <div className="flex justify-between items-center">
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