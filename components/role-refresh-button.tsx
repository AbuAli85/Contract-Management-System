'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Shield } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'

interface RoleRefreshButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

export function RoleRefreshButton({ 
  variant = 'outline', 
  size = 'sm', 
  showIcon = true,
  className = ''
}: RoleRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { forceRefresh } = usePermissions()
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
      {isRefreshing ? 'Refreshing...' : 'Refresh Role'}
    </Button>
  )
} 