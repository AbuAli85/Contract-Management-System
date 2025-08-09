"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, DollarSign, Shield, Clock, CheckCircle, AlertTriangle,
  ArrowRight, FileText, Download, RefreshCw, MessageCircle, Phone,
  Calendar, Star, User, MapPin, Package, Truck, Award, AlertCircle,
  Lock, Unlock, Eye, ThumbsUp, ThumbsDown, Flag, HelpCircle,
  Wallet, TrendingUp, BarChart3, PieChart, Target
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface EscrowTransaction {
  id: string
  booking_id: string
  amount: number
  currency: string
  service_fee: number
  processing_fee: number
  total_amount: number
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'cancelled' | 'refunded'
  created_at: string
  funded_at?: string
  released_at?: string
  
  client: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  
  provider: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  
  service: {
    id: string
    name: string
    description: string
    category: string
  }
  
  milestones: {
    id: string
    title: string
    description: string
    amount: number
    status: 'pending' | 'completed' | 'approved' | 'disputed'
    due_date: string
    completed_at?: string
    approved_at?: string
  }[]
  
  payment_method: {
    type: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto'
    last_four?: string
    brand?: string
  }
  
  dispute?: {
    id: string
    reason: string
    description: string
    status: 'open' | 'under_review' | 'resolved' | 'escalated'
    created_at: string
    resolved_at?: string
    resolution: string
    winner: 'client' | 'provider' | 'split'
  }
  
  timeline: {
    id: string
    type: 'payment' | 'milestone' | 'dispute' | 'release' | 'refund' | 'communication'
    title: string
    description: string
    timestamp: string
    actor: 'client' | 'provider' | 'system' | 'support'
  }[]
}

interface PaymentEscrowSystemProps {
  userRole: 'client' | 'provider' | 'admin'
  userId: string
}

export function PaymentEscrowSystem({ userRole, userId }: PaymentEscrowSystemProps) {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  // Load transactions from API
  useEffect(() => {
    loadTransactions()
  }, [userRole, userId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockTransactions: EscrowTransaction[] = [
        {
          id: 'esc_1',
          booking_id: 'book_1',
          amount: 1500,
          currency: 'USD',
          service_fee: 75, // 5%
          processing_fee: 30,
          total_amount: 1605,
          status: 'funded',
          created_at: '2024-01-15T10:00:00Z',
          funded_at: '2024-01-15T10:15:00Z',
          
          client: {
            id: 'client_1',
            name: 'Michael Chen',
            email: 'michael@example.com',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
          },
          
          provider: {
            id: 'provider_1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'
          },
          
          service: {
            id: 'service_1',
            name: 'Complete SEO Audit & Strategy',
            description: 'Comprehensive SEO analysis with actionable recommendations',
            category: 'Digital Marketing'
          },
          
          milestones: [
            {
              id: 'mile_1',
              title: 'Initial Analysis & Research',
              description: 'Complete website audit and competitor analysis',
              amount: 500,
              status: 'completed',
              due_date: '2024-01-20T00:00:00Z',
              completed_at: '2024-01-19T14:30:00Z',
              approved_at: '2024-01-19T16:00:00Z'
            },
            {
              id: 'mile_2',
              title: 'SEO Strategy Document',
              description: 'Detailed SEO strategy and implementation plan',
              amount: 700,
              status: 'completed',
              due_date: '2024-01-25T00:00:00Z',
              completed_at: '2024-01-24T11:45:00Z'
            },
            {
              id: 'mile_3',
              title: 'Training & Handover',
              description: 'Team training and knowledge transfer session',
              amount: 300,
              status: 'pending',
              due_date: '2024-01-30T00:00:00Z'
            }
          ],
          
          payment_method: {
            type: 'credit_card',
            last_four: '4242',
            brand: 'Visa'
          },
          
          timeline: [
            {
              id: 't1',
              type: 'payment',
              title: 'Payment Funded',
              description: 'Client funded escrow with $1,605',
              timestamp: '2024-01-15T10:15:00Z',
              actor: 'client'
            },
            {
              id: 't2',
              type: 'milestone',
              title: 'Milestone 1 Completed',
              description: 'Initial Analysis & Research completed by provider',
              timestamp: '2024-01-19T14:30:00Z',
              actor: 'provider'
            },
            {
              id: 't3',
              type: 'milestone',
              title: 'Milestone 1 Approved',
              description: 'Client approved milestone 1 - $500 released',
              timestamp: '2024-01-19T16:00:00Z',
              actor: 'client'
            },
            {
              id: 't4',
              type: 'milestone',
              title: 'Milestone 2 Completed',
              description: 'SEO Strategy Document completed by provider',
              timestamp: '2024-01-24T11:45:00Z',
              actor: 'provider'
            }
          ]
        },
        {
          id: 'esc_2',
          booking_id: 'book_2',
          amount: 800,
          currency: 'USD',
          service_fee: 40,
          processing_fee: 20,
          total_amount: 860,
          status: 'disputed',
          created_at: '2024-01-10T09:00:00Z',
          funded_at: '2024-01-10T09:30:00Z',
          
          client: {
            id: 'client_2',
            name: 'Lisa Rodriguez',
            email: 'lisa@example.com'
          },
          
          provider: {
            id: 'provider_2',
            name: 'David Park',
            email: 'david@example.com'
          },
          
          service: {
            id: 'service_2',
            name: 'Social Media Campaign',
            description: 'Complete social media strategy and content creation',
            category: 'Social Media'
          },
          
          milestones: [
            {
              id: 'mile_4',
              title: 'Strategy & Planning',
              description: 'Social media strategy and content calendar',
              amount: 400,
              status: 'completed',
              due_date: '2024-01-15T00:00:00Z',
              completed_at: '2024-01-15T13:00:00Z'
            },
            {
              id: 'mile_5',
              title: 'Content Creation',
              description: '30 social media posts with graphics',
              amount: 400,
              status: 'disputed',
              due_date: '2024-01-22T00:00:00Z'
            }
          ],
          
          payment_method: {
            type: 'paypal'
          },
          
          dispute: {
            id: 'dispute_1',
            reason: 'Quality Issues',
            description: 'Content quality does not match agreed specifications',
            status: 'under_review',
            created_at: '2024-01-23T14:00:00Z',
            resolution: '',
            winner: 'client'
          },
          
          timeline: [
            {
              id: 't5',
              type: 'payment',
              title: 'Payment Funded',
              description: 'Client funded escrow with $860',
              timestamp: '2024-01-10T09:30:00Z',
              actor: 'client'
            },
            {
              id: 't6',
              type: 'milestone',
              title: 'Milestone 1 Completed',
              description: 'Strategy & Planning completed and approved',
              timestamp: '2024-01-15T13:00:00Z',
              actor: 'provider'
            },
            {
              id: 't7',
              type: 'dispute',
              title: 'Dispute Filed',
              description: 'Client filed dispute for milestone 2',
              timestamp: '2024-01-23T14:00:00Z',
              actor: 'client'
            }
          ]
        }
      ]
      
      setTransactions(mockTransactions)
      setLoading(false)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
      setLoading(false)
    }
  }

  const handleApproveMilestone = async (transactionId: string, milestoneId: string) => {
    try {
      // API call to approve milestone
      toast.success('Milestone approved! Funds released to provider.')
      loadTransactions() // Refresh data
    } catch (error) {
      toast.error('Failed to approve milestone')
    }
  }

  const handleDisputeMilestone = async (transactionId: string, milestoneId: string, reason: string) => {
    try {
      // API call to create dispute
      toast.success('Dispute filed successfully. Our team will review it within 24 hours.')
      setShowDisputeModal(false)
      loadTransactions()
    } catch (error) {
      toast.error('Failed to file dispute')
    }
  }

  const handleRequestRefund = async (transactionId: string, reason: string) => {
    try {
      // API call to request refund
      toast.success('Refund request submitted. Processing within 3-5 business days.')
      setShowRefundModal(false)
      loadTransactions()
    } catch (error) {
      toast.error('Failed to request refund')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'funded': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'released': return 'bg-green-100 text-green-700'
      case 'disputed': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      case 'refunded': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'funded': return <DollarSign className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'released': return <Unlock className="h-4 w-4" />
      case 'disputed': return <AlertTriangle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      case 'refunded': return <RefreshCw className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const TransactionCard = ({ transaction }: { transaction: EscrowTransaction }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTransaction(transaction)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userRole === 'client' ? transaction.provider.avatar_url : transaction.client.avatar_url} />
              <AvatarFallback>
                {userRole === 'client' ? transaction.provider.name.charAt(0) : transaction.client.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{transaction.service.name}</h3>
              <p className="text-sm text-gray-600">
                {userRole === 'client' ? `Provider: ${transaction.provider.name}` : `Client: ${transaction.client.name}`}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {getStatusIcon(transaction.status)}
            <span className="ml-1 capitalize">{transaction.status}</span>
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="font-semibold">${transaction.amount.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Service Fee</span>
            <span className="text-sm text-gray-600">${transaction.service_fee}</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between font-semibold">
            <span>Total Paid</span>
            <span>${transaction.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>
              {transaction.milestones.filter(m => m.status === 'approved').length} / {transaction.milestones.length} milestones
            </span>
          </div>
          <Progress 
            value={(transaction.milestones.filter(m => m.status === 'approved').length / transaction.milestones.length) * 100}
            className="h-2"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Created {new Date(transaction.created_at).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const activeTransactions = transactions.filter(t => ['pending', 'funded', 'disputed'].includes(t.status))
  const completedTransactions = transactions.filter(t => ['released', 'refunded', 'cancelled'].includes(t.status))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Escrow Management</h1>
        <p className="text-gray-600">
          Secure payment handling with milestone-based releases and dispute protection
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total in Escrow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${activeTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{activeTransactions.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedTransactions.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disputes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'disputed').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeTransactions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTransactions.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeTransactions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active transactions</h3>
              <p className="text-gray-600">All your transactions have been completed or are pending.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedTransactions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTransactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed transactions</h3>
              <p className="text-gray-600">Completed transactions will appear here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Volume</CardTitle>
                <CardDescription>Monthly payment trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mr-4" />
                  <span>Chart would be implemented here</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>Transaction completion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <PieChart className="h-12 w-12 mr-4" />
                  <span>Chart would be implemented here</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <span>{selectedTransaction.service.name}</span>
                <Badge className={getStatusColor(selectedTransaction.status)}>
                  {getStatusIcon(selectedTransaction.status)}
                  <span className="ml-1 capitalize">{selectedTransaction.status}</span>
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Transaction ID: {selectedTransaction.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Service Amount</p>
                      <p className="font-semibold">${selectedTransaction.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service Fee (5%)</p>
                      <p className="font-semibold">${selectedTransaction.service_fee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Processing Fee</p>
                      <p className="font-semibold">${selectedTransaction.processing_fee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Total Paid</p>
                      <p className="text-lg font-bold">${selectedTransaction.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedTransaction.milestones.map((milestone, index) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                                Milestone {index + 1}
                              </span>
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Amount: ${milestone.amount}</span>
                              <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                              {milestone.completed_at && (
                                <span>Completed: {new Date(milestone.completed_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {userRole === 'client' && milestone.status === 'completed' && (
                              <>
                                <Button 
                                  size="sm"
                                  onClick={() => handleApproveMilestone(selectedTransaction.id, milestone.id)}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowDisputeModal(true)}
                                >
                                  <Flag className="h-4 w-4 mr-1" />
                                  Dispute
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Information */}
              {selectedTransaction.dispute && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-700">Active Dispute</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Reason</p>
                        <p className="font-medium">{selectedTransaction.dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-gray-800">{selectedTransaction.dispute.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(selectedTransaction.dispute.status)}>
                            {selectedTransaction.dispute.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Filed</p>
                          <p className="text-sm">{new Date(selectedTransaction.dispute.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedTransaction.timeline.map((event, index) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getStatusIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()} • {event.actor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <div className="space-x-3">
                  {userRole === 'client' && selectedTransaction.status === 'funded' && (
                    <Button variant="outline" onClick={() => setShowRefundModal(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Request Refund
                    </Button>
                  )}
                </div>
                
                <div className="space-x-3">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File a Dispute</DialogTitle>
            <DialogDescription>
              Please provide details about the issue you're experiencing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Dispute</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                title="Select reason for dispute"
                aria-label="Reason for dispute"
              >
                <option>Quality Issues</option>
                <option>Delivery Delay</option>
                <option>Not as Described</option>
                <option>Communication Issues</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Please describe the issue in detail..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowDisputeModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => handleDisputeMilestone(selectedTransaction?.id || '', '', 'Quality Issues')}
                className="flex-1"
              >
                File Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Please specify the reason for requesting a refund.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Refund Reason</label>
              <Textarea 
                placeholder="Please explain why you're requesting a refund..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowRefundModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => handleRequestRefund(selectedTransaction?.id || '', 'Customer request')}
                className="flex-1"
              >
                Request Refund
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}