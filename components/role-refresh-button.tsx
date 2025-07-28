'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Shield } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RoleRefreshButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  showText?: boolean
  className?: string
  compact?: boolean
}

export function RoleRefreshButton({ 
  variant = 'outline', 
  size = 'sm', 
  showIcon = true,
  showText = true,
  className = '',
  compact = false
}: RoleRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { forceRefresh, role } = usePermissions()
  const { toast } = useToast()

  const handleRefreshRole = async () => {
    setIsRefreshing(true)
    try {
      const newRole = await forceRefresh()
      toast({
        title: 'Role Refreshed',
        description: `Your role has been updated to: ${newRole}`,
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh your role. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // If compact mode, show only icon
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              onClick={handleRefreshRole}
              disabled={isRefreshing}
              className={className}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">Refresh Role</div>
              <div className="text-xs text-muted-foreground">Current: {role}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefreshRole}
      disabled={isRefreshing}
      className={className}
    >
      {showIcon && (
        isRefreshing ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Shield className="mr-2 h-4 w-4" />
        )
      )}
      {showText && (isRefreshing ? 'Refreshing...' : 'Refresh Role')}
    </Button>
  )
} 