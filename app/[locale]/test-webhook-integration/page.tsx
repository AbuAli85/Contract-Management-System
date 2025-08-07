"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Users, Zap } from "lucide-react"

export default function BookingWithDirectWebhookTest() {
  const [formData, setFormData] = useState({
    resource_id: 'conf-room-a',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    total_cost: 0,
    attendees: []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      console.log("🚀 Creating booking with direct Make.com webhook...")
      
      const response = await fetch('/api/bookings/direct-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource_id: formData.resource_id,
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          total_cost: parseFloat(formData.total_cost.toString()) || 0,
          attendees: formData.attendees
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log("✅ Booking created successfully:", data)
        setResult({
          success: true,
          booking: data.booking,
          message: "Booking created and Make.com webhook triggered successfully!"
        })
        
        // Reset form
        setFormData({
          resource_id: 'conf-room-a',
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          total_cost: 0,
          attendees: []
        })
      } else {
        console.error("❌ Booking creation failed:", data)
        setResult({
          success: false,
          error: data.error,
          details: data.details
        })
      }
    } catch (error) {
      console.error("❌ Request failed:", error)
      setResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Direct Make.com Webhook Integration Test
          </h1>
          <p className="text-gray-600">
            Test the booking creation with immediate Make.com webhook trigger
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Create Booking
              </CardTitle>
              <CardDescription>
                Fill out the form to create a new booking. The Make.com webhook will be triggered immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="resource_id">Resource ID</Label>
                  <Input
                    id="resource_id"
                    value={formData.resource_id}
                    onChange={(e) => handleInputChange('resource_id', e.target.value)}
                    placeholder="e.g., conf-room-a"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="title">Booking Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Team Meeting"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="total_cost">Total Cost</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Booking & Trigger Webhook
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Webhook Results
              </CardTitle>
              <CardDescription>
                Results from the booking creation and Make.com webhook trigger
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">
                        ✅ Success!
                      </h3>
                      <p className="text-green-700 mb-3">{result.message}</p>
                      {result.booking && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-medium mb-2">Booking Details:</h4>
                          <ul className="text-sm space-y-1">
                            <li><strong>ID:</strong> {result.booking.id}</li>
                            <li><strong>Title:</strong> {result.booking.title}</li>
                            <li><strong>Resource:</strong> {result.booking.resource_id}</li>
                            <li><strong>Status:</strong> {result.booking.status}</li>
                            <li><strong>Created:</strong> {new Date(result.booking.created_at).toLocaleString()}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">
                        ❌ Error
                      </h3>
                      <p className="text-red-700 mb-2">{result.error}</p>
                      {result.details && (
                        <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          {result.details}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No results yet. Create a booking to see webhook results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Integration Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Integration Guide</CardTitle>
            <CardDescription>
              How this direct webhook integration works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-1">Insert Booking</h3>
                <p className="text-sm text-gray-600">
                  Create the booking record in Supabase database
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-1">Immediate Webhook</h3>
                <p className="text-sm text-gray-600">
                  Instantly call Make.com webhook with booking data
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-1">Full Control</h3>
                <p className="text-sm text-gray-600">
                  Zero reliance on Supabase triggers, immediate and reliable
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
