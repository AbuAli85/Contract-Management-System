"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Bell, 
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Search,
  Filter,
  Video,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Pin,
  Edit,
  Trash2,
  Download,
  Share2,
  Eye,
  EyeOff,
  Settings,
  Plus,
  UserPlus,
  Lock,
  Globe,
  Hash,
  AtSign
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: string
  type: 'text' | 'file' | 'system' | 'reaction'
  reactions: Array<{
    emoji: string
    users: string[]
  }>
  attachments?: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
  }>
  isEdited?: boolean
  isPinned?: boolean
}

interface Channel {
  id: string
  name: string
  type: 'public' | 'private' | 'direct'
  description?: string
  members: string[]
  unreadCount: number
  lastMessage?: Message
  isActive: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  role: string
  lastSeen?: string
}

interface CollaborationHubProps {
  contractId?: string
}

export function RealTimeCollaborationHub({ contractId }: CollaborationHubProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadChannels()
    loadTeamMembers()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id)
    }
  }, [selectedChannel])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChannels = async () => {
    // Mock data - in production, fetch from API
    const mockChannels: Channel[] = [
      {
        id: 'general',
        name: 'General',
        type: 'public',
        description: 'General discussions and announcements',
        members: ['user1', 'user2', 'user3'],
        unreadCount: 0,
        isActive: true,
        lastMessage: {
          id: 'msg_1',
          content: 'Contract #123 has been approved!',
          sender: { id: 'user1', name: 'Sarah Johnson', email: 'sarah@company.com' },
          timestamp: new Date().toISOString(),
          type: 'text',
          reactions: []
        }
      },
      {
        id: 'contracts',
        name: 'Contracts',
        type: 'public',
        description: 'Contract-related discussions',
        members: ['user1', 'user2', 'user3', 'user4'],
        unreadCount: 3,
        isActive: false,
        lastMessage: {
          id: 'msg_2',
          content: 'New contract template uploaded',
          sender: { id: 'user2', name: 'Mike Chen', email: 'mike@company.com' },
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          type: 'text',
          reactions: []
        }
      },
      {
        id: 'legal-team',
        name: 'Legal Team',
        type: 'private',
        description: 'Legal team discussions',
        members: ['user1', 'user3'],
        unreadCount: 1,
        isActive: false,
        lastMessage: {
          id: 'msg_3',
          content: 'Review needed for contract #456',
          sender: { id: 'user3', name: 'Emma Davis', email: 'emma@company.com' },
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          type: 'text',
          reactions: []
        }
      }
    ]

    setChannels(mockChannels)
    setSelectedChannel(mockChannels[0])
  }

  const loadTeamMembers = async () => {
    // Mock data
    const mockMembers: TeamMember[] = [
      {
        id: 'user1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        status: 'online',
        role: 'Legal Manager'
      },
      {
        id: 'user2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        status: 'away',
        role: 'Contract Specialist'
      },
      {
        id: 'user3',
        name: 'Emma Davis',
        email: 'emma@company.com',
        status: 'busy',
        role: 'Legal Counsel'
      },
      {
        id: 'user4',
        name: 'Alex Rodriguez',
        email: 'alex@company.com',
        status: 'offline',
        role: 'HR Manager'
      }
    ]

    setTeamMembers(mockMembers)
  }

  const loadMessages = async (channelId: string) => {
    // Mock messages
    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        content: 'Welcome to the General channel! 👋',
        sender: { id: 'system', name: 'System', email: 'system@company.com' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        type: 'system',
        reactions: []
      },
      {
        id: 'msg_2',
        content: 'Hi everyone! I\'ve uploaded the new contract template.',
        sender: { id: 'user2', name: 'Mike Chen', email: 'mike@company.com' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        type: 'text',
        reactions: [
          { emoji: '👍', users: ['user1', 'user3'] }
        ]
      },
      {
        id: 'msg_3',
        content: 'Thanks Mike! I\'ll review it and let you know if we need any changes.',
        sender: { id: 'user1', name: 'Sarah Johnson', email: 'sarah@company.com' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text',
        reactions: []
      },
      {
        id: 'msg_4',
        content: 'Contract #123 has been approved! 🎉',
        sender: { id: 'user1', name: 'Sarah Johnson', email: 'sarah@company.com' },
        timestamp: new Date().toISOString(),
        type: 'text',
        reactions: [
          { emoji: '🎉', users: ['user2', 'user3'] },
          { emoji: '👍', users: ['user4'] }
        ],
        isPinned: true
      }
    ]

    setMessages(mockMessages)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return

    const message: Message = {
      id: `msg_${Date.now()}`,
      content: newMessage,
      sender: { id: 'current_user', name: 'You', email: 'you@company.com' },
      timestamp: new Date().toISOString(),
      type: 'text',
      reactions: []
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")

    // Simulate typing indicator
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)

    toast({
      title: "Message sent",
      description: "Your message has been delivered",
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return <Hash className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      case 'direct': return <AtSign className="h-4 w-4" />
      default: return <Hash className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 1000 * 60) return 'Just now'
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Collaboration Hub</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Channels</h3>
            <div className="space-y-1">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedChannel?.id === channel.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  {getChannelIcon(channel.type)}
                  <span className="flex-1 text-sm">{channel.name}</span>
                  {channel.unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members</h3>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChannelIcon(selectedChannel.type)}
                  <div>
                    <h3 className="font-semibold">{selectedChannel.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChannel.members.length} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {message.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.sender.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
                      {message.isEdited && (
                        <span className="text-xs text-gray-500">(edited)</span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{attachment.name}</span>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reaction.emoji} {reaction.users.length}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Mike Chen</span>
                      <span className="text-xs text-gray-500">is typing...</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="resize-none"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Select a channel to start chatting
              </h3>
              <p className="text-gray-500">
                Choose a channel from the sidebar to begin collaborating
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 