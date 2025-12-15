'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Pin,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  expires_at: string | null;
  target_departments: string[] | null;
  created_at: string;
  is_read: boolean;
  created_by_user?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const priorityConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  low: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900', label: 'Low' },
  normal: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Normal' },
  important: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Important' },
  urgent: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Urgent' },
};

function AnnouncementItem({ 
  announcement, 
  onMarkRead 
}: { 
  announcement: Announcement; 
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = priorityConfig[announcement.priority] || priorityConfig.normal;
  const PriorityIcon = config.icon;

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!announcement.is_read) {
      onMarkRead(announcement.id);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        !announcement.is_read && "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10",
        announcement.is_pinned && "ring-2 ring-amber-400 dark:ring-amber-600"
      )}
    >
      <button
        onClick={handleExpand}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}>
            <PriorityIcon className={cn("h-4 w-4", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {announcement.is_pinned && (
                <Pin className="h-3 w-3 text-amber-500" />
              )}
              <h4 className={cn(
                "font-medium truncate",
                !announcement.is_read && "font-semibold"
              )}>
                {announcement.title}
              </h4>
              {!announcement.is_read && (
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            {!expanded && (
              <p className="text-sm text-gray-500 truncate">
                {announcement.content}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
              {announcement.created_by_user?.full_name && (
                <> • {announcement.created_by_user.full_name}</>
              )}
            </p>
          </div>
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {announcement.content}
            </p>
          </div>
          {announcement.target_departments && announcement.target_departments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {announcement.target_departments.map(dept => (
                <Badge key={dept} variant="outline" className="text-xs">
                  {dept}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AnnouncementsCard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/employee/announcements');
      const data = await response.json();

      if (response.ok && data.success) {
        setAnnouncements(data.announcements || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (announcementId: string) => {
    try {
      await fetch('/api/employee/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_id: announcementId }),
      });

      setAnnouncements(prev =>
        prev.map(a => a.id === announcementId ? { ...a, is_read: true } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-orange-600" />
            Announcements
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-orange-500">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No announcements</p>
            </div>
          ) : (
            announcements.map(announcement => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

