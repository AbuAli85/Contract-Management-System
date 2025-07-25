"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, MessageCircle, Clock, User } from "lucide-react"

interface ReviewItem {
  id: string
  title: string
  promoter: string
  parties: string
  period: string
  contractLink: string
  submitter?: string
  avatar?: string
  status: string
  contract_number?: string
  job_title?: string
  work_location?: string
}

export default function ReviewPanel() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchReviewItems = async () => {
    setLoading(true)
    try {
      // Fetch contracts that need review (draft or pending status)
      const response = await fetch('/api/contracts?status=draft')
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts')
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch contracts')
      }

      // Transform contracts into review items
      const items: ReviewItem[] = (data.contracts || []).map((contract: any) => ({
        id: contract.id,
        title: contract.contract_number || `Contract ${contract.id.slice(0, 8)}`,
        promoter: contract.promoters && contract.promoters.length > 0 
          ? contract.promoters[0].name_en 
          : 'Unknown Promoter',
        parties: `${contract.first_party?.name_en || 'Unknown'} / ${contract.second_party?.name_en || 'Unknown'}`,
        period: `Created ${new Date(contract.created_at).toLocaleDateString()}`,
        contractLink: `/contracts/${contract.id}`,
        submitter: contract.user_id ? 'System User' : 'Unknown',
        avatar: '/placeholder.svg',
        status: contract.status || 'draft',
        contract_number: contract.contract_number,
        job_title: contract.job_title,
        work_location: contract.work_location
      }))
      
      setReviewItems(items)
      
    } catch (error: any) {
      console.error("Error in review panel:", error)
      setReviewItems([])
      toast({
        title: "Error",
        description: "Failed to load review items",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviewItems()
  }, [])

  const handleAction = async (itemId: string, action: "approve" | "reject" | "comment") => {
    try {
      const endpoint = action === 'approve' ? '/api/contracts/approval/approve' : 
                      action === 'reject' ? '/api/contracts/approval/reject' : 
                      '/api/contracts/approval/comment'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: itemId,
          action: action,
          comments: action === 'comment' ? 'Review comment' : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process action')
      }

      toast({ 
        title: `Action: ${action}`, 
        description: `Successfully processed contract ${itemId}` 
      })
      
      // Refresh the list
      fetchReviewItems()
    } catch (error) {
      console.error('Error processing action:', error)
      toast({
        title: "Error",
        description: `Failed to ${action} contract`,
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'pending':
        return <Badge variant="outline">Pending Review</Badge>
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>Loading review items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Reviews</CardTitle>
        <CardDescription>
          {reviewItems.length} contract{reviewItems.length !== 1 ? 's' : ''} awaiting review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviewItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No contracts pending review</p>
              <p className="text-sm">All contracts are up to date</p>
            </div>
          ) : (
            reviewItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={item.avatar} alt={item.promoter} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.promoter} • {item.parties}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.job_title && `${item.job_title} • `}
                      {item.work_location && `${item.work_location} • `}
                      {item.period}
                    </p>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(item.id, "comment")}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(item.id, "reject")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(item.id, "approve")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
