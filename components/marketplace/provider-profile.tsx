"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, MapPin, Clock, Calendar, Phone, Mail, Globe, 
  Shield, Award, Users, TrendingUp, DollarSign, Heart,
  MessageCircle, Share2, Flag, ChevronRight, Eye, Bookmark,
  Filter, Grid, List, BarChart3, CheckCircle, AlertCircle,
  Video, Image, FileText, Download, ExternalLink, Briefcase,
  Target, Zap, Trophy, ThumbsUp, Quote, Camera, Play
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ProviderProfile {
  id: string
  name: string
  title: string
  company: string
  bio: string
  avatar_url?: string
  cover_image_url?: string
  location: string
  timezone: string
  languages: string[]
  rating: number
  review_count: number
  completion_rate: number
  response_time: string
  member_since: string
  verified: boolean
  pro_badge: boolean
  online_status: 'online' | 'offline' | 'busy'
  hourly_rate: number
  currency: string
  total_earnings: number
  orders_completed: number
  repeat_clients: number
  
  skills: {
    name: string
    level: 'beginner' | 'intermediate' | 'expert'
    years_experience: number
  }[]
  
  certifications: {
    name: string
    issuer: string
    date: string
    credential_url?: string
  }[]
  
  portfolio: {
    id: string
    title: string
    description: string
    category: string
    images: string[]
    video_url?: string
    case_study_url?: string
    technologies: string[]
    client_name?: string
    completion_date: string
    project_value?: number
  }[]
  
  services: {
    id: string
    name: string
    description: string
    category: string
    price: number
    duration: string
    rating: number
    orders: number
    featured: boolean
  }[]
  
  reviews: {
    id: string
    client_name: string
    client_avatar?: string
    rating: number
    comment: string
    service_name: string
    date: string
    helpful_count: number
  }[]
  
  availability: {
    timezone: string
    weekly_hours: number
    available_days: string[]
    preferred_hours: {
      start: string
      end: string
    }
    vacation_mode: boolean
    next_available: string
  }
}

interface ProviderProfileProps {
  providerId: string
}

export function ProviderProfile({ providerId }: ProviderProfileProps) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFollowing, setIsFollowing] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  // Mock data - in real implementation, fetch from API
  useEffect(() => {
    loadProviderProfile()
  }, [providerId])

  const loadProviderProfile = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockProvider: ProviderProfile = {
        id: providerId,
        name: "Sarah Johnson",
        title: "Senior Digital Marketing Specialist",
        company: "Digital Growth Agency",
        bio: "I'm a digital marketing expert with 8+ years of experience helping businesses grow their online presence. I specialize in SEO, content marketing, social media strategy, and paid advertising campaigns. My goal is to deliver measurable results that drive real business growth.",
        avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        cover_image_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=300&fit=crop",
        location: "New York, USA",
        timezone: "EST (UTC-5)",
        languages: ["English (Native)", "Spanish (Fluent)", "French (Conversational)"],
        rating: 4.9,
        review_count: 247,
        completion_rate: 98,
        response_time: "1 hour",
        member_since: "2020-03-15",
        verified: true,
        pro_badge: true,
        online_status: "online",
        hourly_rate: 85,
        currency: "USD",
        total_earnings: 156780,
        orders_completed: 312,
        repeat_clients: 68,
        
        skills: [
          { name: "SEO Optimization", level: "expert", years_experience: 8 },
          { name: "Google Ads", level: "expert", years_experience: 6 },
          { name: "Content Marketing", level: "expert", years_experience: 7 },
          { name: "Social Media Marketing", level: "expert", years_experience: 5 },
          { name: "Email Marketing", level: "intermediate", years_experience: 4 },
          { name: "Analytics & Reporting", level: "expert", years_experience: 6 }
        ],
        
        certifications: [
          {
            name: "Google Ads Certified",
            issuer: "Google",
            date: "2024-01-15",
            credential_url: "https://skillshop.credential.net/embed/abc123"
          },
          {
            name: "HubSpot Content Marketing",
            issuer: "HubSpot Academy",
            date: "2023-11-20"
          },
          {
            name: "Facebook Blueprint Certified",
            issuer: "Meta",
            date: "2023-09-10"
          }
        ],
        
        portfolio: [
          {
            id: "1",
            title: "E-commerce SEO Strategy & Implementation",
            description: "Complete SEO overhaul for fashion e-commerce store resulting in 300% organic traffic increase",
            category: "SEO",
            images: [
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            ],
            technologies: ["Google Analytics", "SEMrush", "Ahrefs", "Google Search Console"],
            client_name: "Fashion Forward Co.",
            completion_date: "2024-01-15",
            project_value: 15000
          },
          {
            id: "2",
            title: "Social Media Campaign for SaaS Startup",
            description: "Multi-platform social media strategy that generated 500K impressions and 2K qualified leads",
            category: "Social Media",
            images: [
              "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop"
            ],
            video_url: "https://example.com/case-study-video",
            technologies: ["Hootsuite", "Canva", "Buffer", "Facebook Ads Manager"],
            completion_date: "2023-12-20",
            project_value: 8500
          }
        ],
        
        services: [
          {
            id: "1",
            name: "Complete SEO Audit & Strategy",
            description: "Comprehensive SEO analysis with actionable recommendations",
            category: "SEO",
            price: 299,
            duration: "5-7 days",
            rating: 4.9,
            orders: 89,
            featured: true
          },
          {
            id: "2", 
            name: "Google Ads Campaign Setup",
            description: "Professional Google Ads campaign creation and optimization",
            category: "PPC",
            price: 499,
            duration: "3-5 days",
            rating: 4.8,
            orders: 67,
            featured: false
          },
          {
            id: "3",
            name: "Social Media Strategy Package",
            description: "30-day social media content calendar and strategy",
            category: "Social Media",
            price: 399,
            duration: "7-10 days",
            rating: 4.9,
            orders: 124,
            featured: true
          }
        ],
        
        reviews: [
          {
            id: "1",
            client_name: "Michael Chen",
            client_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
            rating: 5,
            comment: "Sarah delivered exceptional results! Our organic traffic increased by 250% within 3 months. Her SEO strategy was comprehensive and easy to understand. Highly recommended!",
            service_name: "Complete SEO Audit & Strategy",
            date: "2024-01-20",
            helpful_count: 12
          },
          {
            id: "2",
            client_name: "Lisa Rodriguez",
            rating: 5,
            comment: "Outstanding work on our Google Ads campaign. Sarah optimized our ad spend and improved our ROAS by 180%. Professional communication throughout the project.",
            service_name: "Google Ads Campaign Setup",
            date: "2024-01-15",
            helpful_count: 8
          },
          {
            id: "3",
            client_name: "David Park",
            rating: 4,
            comment: "Great social media strategy! Our engagement rates doubled and we gained 5K new followers. Sarah knows her stuff and delivers on time.",
            service_name: "Social Media Strategy Package", 
            date: "2024-01-10",
            helpful_count: 15
          }
        ],
        
        availability: {
          timezone: "EST (UTC-5)",
          weekly_hours: 40,
          available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          preferred_hours: {
            start: "09:00",
            end: "17:00"
          },
          vacation_mode: false,
          next_available: "Today"
        }
      }
      
      setProvider(mockProvider)
      setLoading(false)
    } catch (error) {
      console.error('Error loading provider profile:', error)
      toast.error('Failed to load provider profile')
      setLoading(false)
    }
  }

  const handleContact = () => {
    setShowContactModal(true)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast.success(isFollowing ? 'Unfollowed provider' : 'Following provider')
  }

  const handleBookService = (serviceId: string) => {
    toast.success(`Booking service ${serviceId}...`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Provider not found</h2>
        <p className="text-gray-600">The provider profile you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Section */}
      <div className="relative">
        <div 
          className={`h-64 bg-gradient-to-r from-blue-600 to-purple-600 bg-cover bg-center ${provider.cover_image_url ? '' : ''}`}
          {...(provider.cover_image_url && { 
            style: { backgroundImage: `url(${provider.cover_image_url})` }
          })}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="relative -mt-20 flex flex-col lg:flex-row items-start lg:items-end space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src={provider.avatar_url} />
                <AvatarFallback className="text-2xl">{provider.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={`absolute -top-1 -right-1 h-6 w-6 rounded-full border-2 border-white ${
                provider.online_status === 'online' ? 'bg-green-500' :
                provider.online_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex-1 bg-white rounded-lg p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
                    {provider.verified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {provider.pro_badge && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Award className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-600">{provider.title}</p>
                  <p className="text-sm text-gray-500">{provider.company}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {provider.rating} ({provider.review_count} reviews)
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {provider.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Responds in {provider.response_time}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-4 lg:mt-0">
                  <Button variant="outline" onClick={handleFollow}>
                    <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" onClick={handleContact}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{provider.bio}</p>
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {provider.skills.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{skill.name}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {skill.years_experience} years
                              </Badge>
                              <Badge className={
                                skill.level === 'expert' ? 'bg-green-100 text-green-700' :
                                skill.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }>
                                {skill.level}
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={
                              skill.level === 'expert' ? 90 :
                              skill.level === 'intermediate' ? 60 : 30
                            } 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Certifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {provider.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Award className="h-8 w-8 text-yellow-500" />
                            <div>
                              <h4 className="font-medium text-gray-900">{cert.name}</h4>
                              <p className="text-sm text-gray-600">
                                {cert.issuer} • {new Date(cert.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {cert.credential_url && (
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {provider.portfolio.map((project) => (
                    <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img 
                            src={project.images[0]} 
                            alt={project.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          {project.video_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                                <Play className="h-4 w-4 mr-2" />
                                Watch Demo
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline">{project.category}</Badge>
                            {project.project_value && (
                              <span className="text-sm font-semibold text-green-600">
                                ${project.project_value.toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {project.technologies.slice(0, 3).map((tech, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {project.technologies.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.technologies.length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            {project.client_name && (
                              <span>Client: {project.client_name}</span>
                            )}
                            <span>{new Date(project.completion_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {provider.services.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                              {service.featured && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-4">{service.description}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                {service.rating} ({service.orders} orders)
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {service.duration}
                              </div>
                              <Badge variant="outline">{service.category}</Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                              ${service.price}
                            </div>
                            <Button 
                              onClick={() => handleBookService(service.id)}
                              className="w-full"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="space-y-6">
                  {provider.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src={review.client_avatar} />
                            <AvatarFallback>{review.client_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span>•</span>
                                  <span>{new Date(review.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{review.comment}</p>
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {review.service_name}
                              </Badge>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{review.helpful_count} helpful</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{provider.completion_rate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{provider.orders_completed}</div>
                    <div className="text-sm text-gray-600">Orders Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{provider.repeat_clients}%</div>
                    <div className="text-sm text-gray-600">Repeat Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${Math.round(provider.total_earnings / 1000)}K+
                    </div>
                    <div className="text-sm text-gray-600">Total Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    ${provider.hourly_rate}
                    <span className="text-lg text-gray-600 font-normal">/hour</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Average hourly rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={
                    provider.online_status === 'online' ? 'bg-green-100 text-green-700' :
                    provider.online_status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }>
                    {provider.online_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Available</span>
                  <span className="text-sm font-medium">{provider.availability.next_available}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekly Hours</span>
                  <span className="text-sm font-medium">{provider.availability.weekly_hours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Timezone</span>
                  <span className="text-sm font-medium">{provider.availability.timezone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {provider.languages.map((language, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      {language}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Actions */}
            <div className="space-y-3">
              <Button onClick={handleContact} className="w-full" size="lg">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Provider
              </Button>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact {provider.name}</DialogTitle>
            <DialogDescription>
              Send a message to discuss your project requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Project inquiry" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea 
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your project and requirements..."
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowContactModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowContactModal(false)
                  toast.success('Message sent successfully!')
                }}
                className="flex-1"
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}