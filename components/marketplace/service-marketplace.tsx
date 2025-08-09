"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Filter, MapPin, Star, Clock, DollarSign, Users, 
  Heart, ShoppingCart, Eye, ChevronRight, TrendingUp, Award,
  Briefcase, Calendar, Phone, Mail, Globe, Shield, Zap,
  Tag, Grid, List, SlidersHorizontal, ArrowUpDown
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface MarketplaceService {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  price_base: number
  currency: string
  duration_minutes: number
  provider: {
    id: string
    name: string
    avatar_url?: string
    rating: number
    review_count: number
    response_time: string
    completion_rate: number
    location: string
    verified: boolean
  }
  images: string[]
  tags: string[]
  rating: number
  review_count: number
  booking_count: number
  featured: boolean
  availability: 'available' | 'busy' | 'unavailable'
  location_type: 'online' | 'on-site' | 'hybrid'
  created_at: string
}

interface ServiceFilters {
  category: string
  location_type: string
  price_range: [number, number]
  rating_min: number
  availability: string
  verified_only: boolean
  featured_only: boolean
  sort_by: 'price_low' | 'price_high' | 'rating' | 'popularity' | 'newest'
}

export function ServiceMarketplace() {
  const [services, setServices] = useState<MarketplaceService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const [filters, setFilters] = useState<ServiceFilters>({
    category: 'all',
    location_type: 'all',
    price_range: [0, 1000],
    rating_min: 0,
    availability: 'all',
    verified_only: false,
    featured_only: false,
    sort_by: 'popularity'
  })

  const categories = [
    'Digital Marketing',
    'Web Development',
    'Graphic Design',
    'Content Writing',
    'SEO Services',
    'Social Media Management',
    'Video Production',
    'Photography',
    'Consulting',
    'Translation'
  ]

  // Load services from Supabase
  useEffect(() => {
    loadMarketplaceServices()
  }, [filters, searchTerm])

  const loadMarketplaceServices = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('provider_services')
        .select(`
          id,
          name,
          description,
          category,
          subcategory,
          price_base,
          currency,
          duration_minutes,
          tags,
          images,
          created_at,
          provider:provider_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
      
      // Apply filters
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }
      
      // Apply sorting
      switch (filters.sort_by) {
        case 'price_low':
          query = query.order('price_base', { ascending: true })
          break
        case 'price_high':
          query = query.order('price_base', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(50)
      
      if (error) throw error
      
      // Transform data to match interface
      const transformedServices: MarketplaceService[] = data?.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        category: service.category || 'Other',
        subcategory: service.subcategory || '',
        price_base: service.price_base || 0,
        currency: service.currency || 'USD',
        duration_minutes: service.duration_minutes || 60,
        provider: {
          id: service.provider?.id || '',
          name: service.provider?.full_name || 'Unknown Provider',
          avatar_url: service.provider?.avatar_url,
          rating: 4.5 + Math.random() * 0.5, // Mock data
          review_count: Math.floor(Math.random() * 100) + 10,
          response_time: '2 hours',
          completion_rate: 95 + Math.floor(Math.random() * 5),
          location: 'Remote',
          verified: Math.random() > 0.3
        },
        images: service.images || [],
        tags: service.tags || [],
        rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 50) + 5,
        booking_count: Math.floor(Math.random() * 200) + 20,
        featured: Math.random() > 0.7,
        availability: ['available', 'busy', 'unavailable'][Math.floor(Math.random() * 3)] as any,
        location_type: ['online', 'on-site', 'hybrid'][Math.floor(Math.random() * 3)] as any,
        created_at: service.created_at
      })) || []
      
      setServices(transformedServices)
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(serviceId)) {
      newFavorites.delete(serviceId)
      toast.success('Removed from favorites')
    } else {
      newFavorites.add(serviceId)
      toast.success('Added to favorites')
    }
    setFavorites(newFavorites)
  }

  const handleBookService = (service: MarketplaceService) => {
    // Navigate to booking page or open booking modal
    toast.success(`Booking ${service.name}...`)
  }

  const filteredServices = services.filter(service => {
    if (filters.verified_only && !service.provider.verified) return false
    if (filters.featured_only && !service.featured) return false
    if (service.rating < filters.rating_min) return false
    if (service.price_base < filters.price_range[0] || service.price_base > filters.price_range[1]) return false
    return true
  })

  const ServiceCard = ({ service }: { service: MarketplaceService }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={service.provider.avatar_url} />
                <AvatarFallback>{service.provider.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{service.provider.name}</h3>
                  {service.provider.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    {service.provider.rating.toFixed(1)} ({service.provider.review_count})
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.provider.response_time}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(service.id)}
              className="shrink-0"
            >
              <Heart 
                className={`h-4 w-4 ${favorites.has(service.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
              />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg text-gray-900 mb-2">{service.name}</h4>
              <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {service.category}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {service.location_type}
              </Badge>
              {service.featured && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-lg text-gray-900">
                    ${service.price_base.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {Math.floor(service.duration_minutes / 60)}h
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  {service.booking_count} bookings
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  onClick={() => handleBookService(service)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="sm"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Marketplace</h1>
        <p className="text-gray-600">
          Discover and book professional services from verified providers
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services, providers, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.sort_by} onValueChange={(value) => setFilters({...filters, sort_by: value as any})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-32"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div>
              <Label className="text-sm font-medium mb-2 block">Price Range</Label>
              <Slider
                value={filters.price_range}
                onValueChange={(value) => setFilters({...filters, price_range: value as [number, number]})}
                max={1000}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${filters.price_range[0]}</span>
                <span>${filters.price_range[1]}+</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Minimum Rating</Label>
              <Select value={filters.rating_min.toString()} onValueChange={(value) => setFilters({...filters, rating_min: Number(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Service Type</Label>
              <Select value={filters.location_type} onValueChange={(value) => setFilters({...filters, location_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online Only</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.verified_only}
                  onCheckedChange={(checked) => setFilters({...filters, verified_only: checked})}
                />
                <Label className="text-sm">Verified providers only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={filters.featured_only}
                  onCheckedChange={(checked) => setFilters({...filters, featured_only: checked})}
                />
                <Label className="text-sm">Featured services only</Label>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${filteredServices.length} services found`}
        </p>
        
        {filteredServices.length > 0 && !loading && (
          <div className="text-sm text-gray-500">
            Showing results for {searchTerm ? `"${searchTerm}"` : 'all services'}
          </div>
        )}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button onClick={() => {
            setSearchTerm('')
            setFilters({
              category: 'all',
              location_type: 'all',
              price_range: [0, 1000],
              rating_min: 0,
              availability: 'all',
              verified_only: false,
              featured_only: false,
              sort_by: 'popularity'
            })
          }}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}