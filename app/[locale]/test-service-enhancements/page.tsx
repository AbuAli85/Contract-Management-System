"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/error-boundary"
import { ServiceCardSkeleton } from "@/components/services/service-card-skeleton"
import { ServiceSearchFilters } from "@/components/services/service-search-filters"
import { ApproveRejectButtons } from "@/components/services/approve-reject-buttons"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

// Mock data for testing
const mockServices = [
  {
    id: "1",
    service_name: "Web Development",
    status: "pending" as const,
    provider_name: "John Doe",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    service_name: "Mobile App Development",
    status: "approved" as const,
    provider_name: "Jane Smith",
    created_at: "2024-01-14T09:15:00Z",
    updated_at: "2024-01-15T14:20:00Z"
  },
  {
    id: "3",
    service_name: "UI/UX Design",
    status: "rejected" as const,
    provider_name: "Mike Johnson",
    created_at: "2024-01-13T16:45:00Z",
    updated_at: "2024-01-14T11:30:00Z"
  },
  {
    id: "4",
    service_name: "Database Administration",
    status: "active" as const,
    provider_name: "Sarah Wilson",
    created_at: "2024-01-12T08:00:00Z",
    updated_at: "2024-01-15T16:00:00Z"
  }
]

export default function TestServiceEnhancementsPage() {
  const [services, setServices] = useState(mockServices)
  const [filteredServices, setFilteredServices] = useState(mockServices)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showError, setShowError] = useState(false)

  // Filter services based on search query and status filter
  const handleFilterChange = () => {
    let filtered = services

    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.provider_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(service => service.status === statusFilter)
    }

    setFilteredServices(filtered)
  }

  // Update service status
  const handleStatusUpdate = (serviceId: string, newStatus: string) => {
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId ? { ...service, status: newStatus as any } : service
      )
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Simulate error for testing error boundary
  const triggerError = () => {
    setShowError(true)
    throw new Error("Test error for error boundary")
  }

  if (showError) {
    throw new Error("Test error for error boundary")
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Enhancements Test</h1>
        <p className="text-muted-foreground">
          Test all the service management enhancements: loading skeletons, error boundaries, 
          search/filters, and role-based approval buttons.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Test different scenarios and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => setServices(mockServices)}>
                Reset Services
              </Button>
              <Button variant="outline" onClick={triggerError}>
                Test Error Boundary
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>• Search and filter the services below</p>
              <p>• Try the approval buttons (admin role simulation)</p>
              <p>• Test error boundary by clicking the button above</p>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>
              Test the search and filter functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceSearchFilters
              onSearchChange={(query) => {
                setSearchQuery(query)
                setTimeout(handleFilterChange, 100) // Debounce
              }}
              onStatusFilterChange={(status) => {
                setStatusFilter(status)
                setTimeout(handleFilterChange, 100) // Debounce
              }}
              onClearFilters={() => {
                setSearchQuery("")
                setStatusFilter("")
                setFilteredServices(services)
              }}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
            />
          </CardContent>
        </Card>

        {/* Services List */}
        <Card>
          <CardHeader>
            <CardTitle>Services List</CardTitle>
            <CardDescription>
              Test the services list with approval buttons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No services match your search criteria.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{service.service_name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 ${getStatusColor(service.status)}`}
                            >
                              {getStatusIcon(service.status)}
                              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            Provider: <span className="font-medium">{service.provider_name}</span>
                          </p>
                          <div className="text-sm text-muted-foreground">
                            <p>Created: {formatDate(service.created_at)}</p>
                            <p>Updated: {formatDate(service.updated_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ApproveRejectButtons
                            serviceId={service.id}
                            currentStatus={service.status}
                            onStatusUpdate={(newStatus) => handleStatusUpdate(service.id, newStatus)}
                          />
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading Skeleton Test */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Skeleton Test</CardTitle>
            <CardDescription>
              Test the loading skeleton component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceCardSkeleton />
          </CardContent>
        </Card>

        {/* Error Boundary Test */}
        <Card>
          <CardHeader>
            <CardTitle>Error Boundary Test</CardTitle>
            <CardDescription>
              Test the error boundary component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  This content is wrapped in an error boundary. If an error occurs, 
                  it will be caught and displayed with a retry option.
                </p>
              </div>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 