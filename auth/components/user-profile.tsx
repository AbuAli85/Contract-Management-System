'use client'

import { useAuth } from '@/src/components/auth/simple-auth-provider'
import type { UserProfile } from '@/types/custom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { User, Settings, LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

export function UserProfile() {
  const { user, profile, roles, signOut } = useAuth()

  if (!user || !profile) {
    return null
  }

  // Extract user profile fields with a type assertion to handle optional data
  const {
    avatar_url = '',
    full_name,
    role: profileRole,
  } = profile as UserProfile

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Safely get avatar URL with fallback
  const avatarUrl = avatar_url
  const displayName = full_name || user.email || 'User'
  const userRole = profileRole || 'user'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {full_name ? getInitials(full_name) : user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Shield className="h-3 w-3" />
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/auth/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile or smaller spaces
export function UserProfileCompact() {
  const { user, profile } = useAuth()

  if (!user || !profile) {
    return null
  }

  // Type assertion to ensure profile has the correct type
  const {
    avatar_url: compactAvatarUrl = '',
    full_name: compactFullName,
    role: compactRole,
  } = profile as UserProfile

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Safely get avatar URL with fallback
  const avatarUrl = compactAvatarUrl
  const displayName = compactFullName || user.email || 'User'
  const userRole = compactRole || 'user'

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="text-xs">
          {compactFullName ? getInitials(compactFullName) : user.email?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="hidden sm:block">
        <p className="text-sm font-medium">
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {userRole}
        </p>
      </div>
    </div>
  )
} 