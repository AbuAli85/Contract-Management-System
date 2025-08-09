"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Star, Users, Shield, TrendingUp, ArrowRight, 
  CheckCircle, DollarSign, Clock, Globe, Award, Zap,
  Target, BarChart3, Heart, MessageCircle, Calendar,
  Briefcase, Camera, Code, Palette, PenTool, Volume2,
  Monitor, Smartphone, Database, Cloud, Lock, Headphones
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ServiceMarketplace } from '@/components/marketplace/service-marketplace'

interface FeaturedService {
  id: string
  title: string
  description: string
  category: string
  price: number
  duration: string
  provider: {
    name: string
    avatar: string
    rating: number
    reviews: number
  }
  image: string
  featured: boolean
}

interface CategoryIcon {
  [key: string]: React.ReactNode
}

export default function MarketplacePage() {
  const categories = [
    { 
      name: 'Digital Marketing', 
      icon: <TrendingUp className="h-6 w-6" />,
      services: 1245,
      description: 'SEO, PPC, Social Media, Content Marketing'
    },
    { 
      name: 'Web Development', 
      icon: <Code className="h-6 w-6" />,
      services: 892,
      description: 'Frontend, Backend, Full-stack Development'
    },
    { 
      name: 'Graphic Design', 
      icon: <Palette className="h-6 w-6" />,
      services: 1156,
      description: 'Logo Design, Branding, Print Design'
    },
    { 
      name: 'Content Writing', 
      icon: <PenTool className="h-6 w-6" />,
      services: 743,
      description: 'Blog Posts, Copywriting, Technical Writing'
    },
    { 
      name: 'Video Production', 
      icon: <Camera className="h-6 w-6" />,
      services: 567,
      description: 'Video Editing, Animation, Motion Graphics'
    },
    { 
      name: 'Audio Services', 
      icon: <Volume2 className="h-6 w-6" />,
      services: 334,
      description: 'Voiceover, Music Production, Sound Design'
    },
    { 
      name: 'Mobile Apps', 
      icon: <Smartphone className="h-6 w-6" />,
      services: 445,
      description: 'iOS, Android, React Native Development'
    },
    { 
      name: 'Data & Analytics', 
      icon: <Database className="h-6 w-6" />,
      services: 298,
      description: 'Data Analysis, Business Intelligence, ML'
    }
  ]

  const featuredServices: FeaturedService[] = [
    {
      id: '1',
      title: 'Complete SEO Audit & Strategy',
      description: 'Comprehensive SEO analysis with actionable recommendations to boost your rankings',
      category: 'Digital Marketing',
      price: 299,
      duration: '5-7 days',
      provider: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
        rating: 4.9,
        reviews: 247
      },
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      featured: true
    },
    {
      id: '2',
      title: 'Professional Logo Design Package',
      description: 'Custom logo design with unlimited revisions and brand guidelines',
      category: 'Graphic Design',
      price: 199,
      duration: '3-5 days',
      provider: {
        name: 'Alex Chen',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
        rating: 4.8,
        reviews: 156
      },
      image: 'https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=400&h=250&fit=crop',
      featured: true
    },
    {
      id: '3',
      title: 'React.js Web Application Development',
      description: 'Custom React.js web application with modern design and functionality',
      category: 'Web Development',
      price: 899,
      duration: '2-3 weeks',
      provider: {
        name: 'Maria Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
        rating: 5.0,
        reviews: 89
      },
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
      featured: true
    }
  ]

  const stats = [
    { label: 'Active Services', value: '5,000+', icon: <Briefcase className="h-5 w-5" /> },
    { label: 'Verified Providers', value: '2,500+', icon: <Shield className="h-5 w-5" /> },
    { label: 'Projects Completed', value: '15,000+', icon: <CheckCircle className="h-5 w-5" /> },
    { label: 'Customer Satisfaction', value: '98%', icon: <Star className="h-5 w-5" /> }
  ]

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'CEO, TechStart',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      content: 'Found the perfect developer for our project. The quality of work exceeded our expectations and the platform made collaboration seamless.',
      rating: 5
    },
    {
      name: 'Lisa Park',
      role: 'Marketing Director',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
      content: 'The SEO services I received boosted our organic traffic by 300%. Professional, reliable, and results-driven.',
      rating: 5
    },
    {
      name: 'David Wilson',
      role: 'Startup Founder',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      content: 'Secure payments and milestone-based releases gave me confidence. The escrow system protected both parties perfectly.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl lg:text-6xl font-bold mb-6"
            >
              Find & Hire the Best
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {" "}Freelancers
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl lg:text-2xl text-blue-100 mb-8"
            >
              Connect with verified professionals for digital marketing, development, design, and more. 
              Secure payments and quality guaranteed.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="What service are you looking for?"
                  className="pl-12 pr-24 py-4 text-lg bg-white border-0 shadow-lg"
                />
                <Button className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Search
                </Button>
              </div>
            </motion.div>

            {/* Popular Searches */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <span className="text-blue-200">Popular:</span>
              {['SEO', 'Logo Design', 'Web Development', 'Content Writing', 'Social Media'].map((term) => (
                <Badge key={term} variant="secondary" className="bg-white/20 text-white hover:bg-white/30 cursor-pointer">
                  {term}
                </Badge>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore thousands of services across different categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <div className="flex items-center justify-center text-sm text-blue-600">
                      <span>{category.services.toLocaleString()} services</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hand-picked services from our top-rated providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
                  <div className="relative">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={service.provider.avatar} />
                        <AvatarFallback>{service.provider.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{service.provider.name}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {service.provider.rating} ({service.provider.reviews})
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="text-xs mb-2">{service.category}</Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {service.duration}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${service.price}</div>
                        <Button size="sm" className="mt-2 w-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/marketplace/services">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                View All Services
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your project done in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Find the Right Service',
                description: 'Browse through thousands of services or post your project requirements',
                icon: <Search className="h-8 w-8" />
              },
              {
                step: '2',
                title: 'Secure Payment',
                description: 'Pay securely through our escrow system. Funds are released upon completion',
                icon: <Shield className="h-8 w-8" />
              },
              {
                step: '3',
                title: 'Get Your Project Done',
                description: 'Collaborate with your chosen provider and receive high-quality results',
                icon: <CheckCircle className="h-8 w-8" />
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full mx-auto mb-6">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied clients who found success on our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of businesses that trust our platform for their project needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Users className="h-5 w-5 mr-2" />
                Find Services
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Briefcase className="h-5 w-5 mr-2" />
                Become a Provider
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { icon: <Shield className="h-6 w-6" />, text: 'Secure Payments' },
              { icon: <CheckCircle className="h-6 w-6" />, text: 'Quality Guaranteed' },
              { icon: <Clock className="h-6 w-6" />, text: '24/7 Support' },
              { icon: <Award className="h-6 w-6" />, text: 'Verified Providers' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center space-x-3 text-gray-600">
                {item.icon}
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}