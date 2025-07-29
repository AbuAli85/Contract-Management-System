'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight,
  Star,
  Eye
} from 'lucide-react'

export default function HomePage() {
  const params = useParams()
  const locale = params.locale as string
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <Badge variant="default" className="text-sm">
              <Star className="h-3 w-3 mr-1" />
              Professional Contract Management
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 max-w-4xl mx-auto">
              Transform Your Contract Management with 
              <span className="text-blue-600"> Modern UI/UX</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the beautiful new interface that replaces the old basic CRM system. 
              Professional, engaging, and user-friendly design for both admins and promoters.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg">
              <Link href="/en/auth/login">
                <ArrowRight className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/en/auth/signup">
                <Users className="mr-2 h-5 w-5" />
                Sign Up
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Contract Management</CardTitle>
              <CardDescription>
                Advanced contract generation, editing, and tracking with beautiful interfaces
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Promoter CRM</CardTitle>
              <CardDescription>
                Professional promoter management with analytics, tasks, and performance tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Real-time dashboards with KPI tracking and performance analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Experience the beautiful new UI/UX that makes contract management engaging and professional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="text-lg px-8 py-4">
                <Link href="/en/auth/login">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Start Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
