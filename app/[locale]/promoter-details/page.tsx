"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  User,
  Eye,
  ArrowLeft,
  Loader2,
  Users,
  Filter,
} from "lucide-react"
import { useUserRole } from "@/hooks/useUserRole"

interface Promoter {
  id: string
  name_en: string
  name_ar: string
  email: string
  phone: string
  status: string
  created_at: string
}

export default function PromoterDetailsPage() {
  const router = useRouter()
  const [promoters, setPromoters] = useState<Promoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<Promoter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const role = useUserRole()

  useEffect(() => {
    fetchPromoters()
  }, [])

  useEffect(() => {
    filterPromoters()
  }, [promoters, searchTerm, statusFilter])

  async function fetchPromoters() {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, email, phone, status, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setPromoters(data || [])
    } catch (error) {
      console.error('Error fetching promoters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterPromoters() {
    let filtered = promoters

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(promoter =>
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.phone.includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(promoter => promoter.status === statusFilter)
    }

    setFilteredPromoters(filtered)
  }

  function handleViewPromoter(promoterId: string) {
    router.push("/manage-promoters/" + promoterId)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promoters...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promoter Profiles</h1>
          <p className="text-muted-foreground">Select a promoter to view their detailed profile</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {role === "admin" && (
            <Button onClick={() => router.push("/manage-promoters/new")}>
              <User className="mr-2 h-4 w-4" />
              Add New Promoter
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>Find promoters by name, email, or phone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search promoters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promoters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPromoters.map((promoter) => (
          <Card key={promoter.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} alt={promoter.name_en} />
                    <AvatarFallback>{promoter.name_en.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{promoter.name_en}</h3>
                    <p className="text-sm text-muted-foreground">{promoter.name_ar}</p>
                  </div>
                </div>
                <Badge variant={promoter.status === "active" ? "default" : "secondary"}>
                  {promoter.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {promoter.email || "N/A"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Phone:</span> {promoter.phone || "N/A"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(promoter.created_at).toLocaleDateString()}
                </div>
                <Button
                  onClick={() => handleViewPromoter(promoter.id)}
                  className="w-full mt-3"
                  size="sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPromoters.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No promoters found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No promoters have been added yet"}
            </p>
            {role === "admin" && (
              <Button onClick={() => router.push("/manage-promoters/new")}>
                <User className="mr-2 h-4 w-4" />
                Add First Promoter
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 