"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Shield, Users, FileText, BarChart3, Settings, Loader2 } from "lucide-react"

// TypeScript interfaces
interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface User {
  id: string
  email: string
  full_name?: string
  role: "admin" | "manager" | "user" | "viewer"
  permissions?: string[]
  status?: string // Added to fix type error
}

interface PermissionsManagerProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPermissionsUpdate: () => void
}

// Available permissions - moved outside component to avoid recreation
const AVAILABLE_PERMISSIONS: Permission[] = [
  // User Management
  {
    id: "users.view",
    name: "View Users",
    description: "Can view user list and details",
    category: "User Management",
  },
  {
    id: "users.create",
    name: "Create Users",
    description: "Can create new users",
    category: "User Management",
  },
  {
    id: "users.edit",
    name: "Edit Users",
    description: "Can edit user information",
    category: "User Management",
  },
  {
    id: "users.delete",
    name: "Delete Users",
    description: "Can delete users",
    category: "User Management",
  },
  {
    id: "users.bulk",
    name: "Bulk Actions",
    description: "Can perform bulk operations on users",
    category: "User Management",
  },

  // Contract Management
  {
    id: "contracts.view",
    name: "View Contracts",
    description: "Can view contracts",
    category: "Contract Management",
  },
  {
    id: "contracts.create",
    name: "Create Contracts",
    description: "Can create new contracts",
    category: "Contract Management",
  },
  {
    id: "contracts.edit",
    name: "Edit Contracts",
    description: "Can edit contracts",
    category: "Contract Management",
  },
  {
    id: "contracts.delete",
    name: "Delete Contracts",
    description: "Can delete contracts",
    category: "Contract Management",
  },
  {
    id: "contracts.approve",
    name: "Approve Contracts",
    description: "Can approve contracts",
    category: "Contract Management",
  },

  // Dashboard & Analytics
  {
    id: "dashboard.view",
    name: "View Dashboard",
    description: "Can view dashboard",
    category: "Dashboard",
  },
  {
    id: "analytics.view",
    name: "View Analytics",
    description: "Can view analytics and reports",
    category: "Dashboard",
  },
  {
    id: "reports.generate",
    name: "Generate Reports",
    description: "Can generate reports",
    category: "Dashboard",
  },

  // System Administration
  {
    id: "settings.view",
    name: "View Settings",
    description: "Can view system settings",
    category: "System",
  },
  {
    id: "settings.edit",
    name: "Edit Settings",
    description: "Can edit system settings",
    category: "System",
  },
  { id: "logs.view", name: "View Logs", description: "Can view system logs", category: "System" },
  {
    id: "backup.create",
    name: "Create Backups",
    description: "Can create system backups",
    category: "System",
  },
]

// Role-based default permissions
const ROLE_PERMISSIONS = {
  admin: AVAILABLE_PERMISSIONS.map((p) => p.id), // All permissions
  manager: [
    "users.view",
    "users.create",
    "users.edit",
    "contracts.view",
    "contracts.create",
    "contracts.edit",
    "contracts.approve",
    "dashboard.view",
    "analytics.view",
    "reports.generate",
    "settings.view",
  ],
  user: ["contracts.view", "contracts.create", "contracts.edit", "dashboard.view"],
  viewer: ["contracts.view", "dashboard.view"],
}

export default function PermissionsManager({
  user,
  open,
  onOpenChange,
  onPermissionsUpdate,
}: PermissionsManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(user?.role || "user")
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  // Memoize permissions by category to avoid recalculation
  const permissionsByCategory = useMemo(() => {
    return AVAILABLE_PERMISSIONS.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = []
        }
        acc[permission.category].push(permission)
        return acc
      },
      {} as Record<string, Permission[]>,
    )
  }, [])

  // Initialize permissions when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role)
      setSelectedPermissions(new Set(user.permissions || ROLE_PERMISSIONS[user.role] || []))
    }
  }, [user])

  const handleRoleChange = (newRole: string) => {
    setRole(newRole as keyof typeof ROLE_PERMISSIONS)
    setSelectedPermissions(
      new Set(ROLE_PERMISSIONS[newRole as keyof typeof ROLE_PERMISSIONS] || []),
    )
  }

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = new Set(selectedPermissions)
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId)
    } else {
      newPermissions.add(permissionId)
    }
    setSelectedPermissions(newPermissions)
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryPermissions = permissionsByCategory[category].map((p) => p.id)
    const newPermissions = new Set(selectedPermissions)

    if (checked) {
      categoryPermissions.forEach((permissionId) => newPermissions.add(permissionId))
    } else {
      categoryPermissions.forEach((permissionId) => newPermissions.delete(permissionId))
    }

    setSelectedPermissions(newPermissions)
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          role: role,
          permissions: Array.from(selectedPermissions),
          // Keep other user fields unchanged
          email: user.email,
          status: user.status || "active",
        }),
      })

      if (response.ok) {
        toast({
          title: "Permissions updated",
          description: "User permissions have been updated successfully.",
        })
        onPermissionsUpdate()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update permissions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "User Management":
        return <Users className="h-4 w-4" />
      case "Contract Management":
        return <FileText className="h-4 w-4" />
      case "Dashboard":
        return <BarChart3 className="h-4 w-4" />
      case "System":
        return <Settings className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  // Check if all permissions in category are selected
  const isCategorySelected = (category: string) => {
    const categoryPermissions = permissionsByCategory[category].map((p) => p.id)
    return categoryPermissions.every((permissionId) => selectedPermissions.has(permissionId))
  }

  // Check if some permissions in category are selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissionsByCategory[category].map((p) => p.id)
    const selectedCount = categoryPermissions.filter((permissionId) =>
      selectedPermissions.has(permissionId),
    ).length
    return selectedCount > 0 && selectedCount < categoryPermissions.length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions - {user?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-2">
              {Object.keys(ROLE_PERMISSIONS).map((roleOption) => (
                <Button
                  key={roleOption}
                  variant={role === roleOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRoleChange(roleOption)}
                >
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Permissions by Category */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Permissions</label>
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isCategorySelected(category)}
                      ref={(el) => {
                        if (el) {
                          ;(el as HTMLInputElement).indeterminate =
                            isCategoryPartiallySelected(category)
                        }
                      }}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <span className="font-medium">{category}</span>
                    </div>
                  </div>
                  <div className="ml-6 space-y-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedPermissions.has(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div>
                          <div className="text-sm font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
