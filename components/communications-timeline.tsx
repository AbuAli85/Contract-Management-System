"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { format, parseISO } from "date-fns"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Building2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Communication {
  id: string
  party_id: string
  type: "email" | "phone" | "meeting" | "note" | "other"
  subject: string
  description: string
  communication_time: string
  participants: string[]
  outcome: string
  status: "sent" | "received" | "pending" | "failed"
  attachments: { file_url: string; file_name: string }[]
  created_by: string
  created_at: string
  updated_at: string
}

interface CommunicationsTimelineProps {
  partyId: string
  className?: string
}

export default function CommunicationsTimeline({
  partyId,
  className,
}: CommunicationsTimelineProps) {
  const { toast } = useToast()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { ref: loadMoreRef, inView } = useInView()
  const loadingRef = useRef<HTMLDivElement>(null)

  const LIMIT = 20

  const fetchCommunications = useCallback(
    async (isLoadMore = false) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        const { data, error: fetchError } = await supabase.rpc("get_party_communications", {
          p_party_id: partyId,
          p_offset: isLoadMore ? offset : 0,
          p_limit: LIMIT,
        })

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        if (data && Array.isArray(data)) {
          if (isLoadMore) {
            setCommunications((prev) => [...prev, ...data])
          } else {
            setCommunications(data)
          }

          setHasMore(data.length === LIMIT)
          setOffset(isLoadMore ? offset + LIMIT : LIMIT)
        } else {
          setCommunications([])
          setHasMore(false)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch communications"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [partyId, offset, loading, toast],
  )

  // Initial load
  useEffect(() => {
    fetchCommunications()
  }, [partyId])

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchCommunications(true)
    }
  }, [inView, hasMore, loading, fetchCommunications])

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "meeting":
        return <Calendar className="h-4 w-4" />
      case "note":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "default",
      received: "secondary",
      pending: "outline",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      email: "default",
      phone: "secondary",
      meeting: "outline",
      note: "outline",
      other: "outline",
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const formatCommunicationTime = (timeString: string) => {
    try {
      const date = parseISO(timeString)
      return format(date, "MMM dd, yyyy 'at' HH:mm")
    } catch {
      return timeString
    }
  }

  if (error && communications.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communications Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Failed to load communications</h3>
              <p className="mb-4 text-muted-foreground">{error}</p>
              <Button onClick={() => fetchCommunications()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communications Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {communications.length === 0 && !loading ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No communications yet</h3>
              <p className="text-muted-foreground">
                Communications with this party will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              {communications.map((communication, index) => (
                <div key={communication.id} className="relative">
                  {/* Timeline line */}
                  {index < communications.length - 1 && (
                    <div className="absolute left-6 top-8 h-full w-0.5 bg-border" />
                  )}

                  <div className="flex gap-4 pb-6">
                    {/* Timeline dot */}
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        {getCommunicationIcon(communication.type)}
                      </div>
                    </div>

                    {/* Communication content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{communication.subject}</h4>
                            {getTypeBadge(communication.type)}
                            {getStatusBadge(communication.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCommunicationTime(communication.communication_time)}
                          </p>
                        </div>
                      </div>

                      {communication.description && (
                        <p className="text-sm text-muted-foreground">{communication.description}</p>
                      )}

                      {communication.participants && communication.participants.length > 0 && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Participants: {communication.participants.join(", ")}
                          </span>
                        </div>
                      )}

                      {communication.outcome && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="mb-1 text-sm font-medium">Outcome:</p>
                          <p className="text-sm">{communication.outcome}</p>
                        </div>
                      )}

                      {communication.attachments && communication.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {communication.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <FileText className="h-3 w-3" />
                                {attachment.file_name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {loading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading more...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Loading indicator */}
              {loading && communications.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading communications...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
