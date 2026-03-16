import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Loader2, Zap, LogOut, Users, ClipboardList, CheckCircle, Clock,
  Shield, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  client_user: "Client",
  reviewer: "Reviewer",
  coordinator: "Coordinator",
  operations_admin: "Ops Admin",
  platform_admin: "Platform Admin",
  super_admin: "Super Admin",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  client_user: "bg-zinc-700 text-zinc-200",
  reviewer: "bg-blue-900 text-blue-200",
  coordinator: "bg-purple-900 text-purple-200",
  operations_admin: "bg-orange-900 text-orange-200",
  platform_admin: "bg-red-900 text-red-200",
  super_admin: "bg-rose-900 text-rose-200",
  admin: "bg-rose-900 text-rose-200",
};

const SUPER_ROLES = ["platform_admin", "super_admin", "admin"];

export default function AdminPanel() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "cases">("overview");

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: activeTab === "users",
  });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      refetchUsers();
    },
    onError: (err) => toast.error(err.message || "Failed to update role"),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && isAuthenticated && user) {
      const adminRoles = ["operations_admin", "platform_admin", "super_admin", "admin"];
      if (!adminRoles.includes(user.role ?? "")) {
        navigate("/reviewer");
      }
    }
  }, [authLoading, isAuthenticated, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">SmartPRO</span>
            <span className="text-muted-foreground text-sm hidden sm:block">/ Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/reviewer")} className="gap-2 hidden sm:flex">
              <ClipboardList className="w-3.5 h-3.5" /> Cases
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-muted/50 p-1 rounded-lg w-fit">
          {(["overview", "users", "cases"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Requests", value: stats?.totalRequests ?? 0, icon: ClipboardList, color: "text-blue-400" },
                    { label: "Pending Cases", value: stats?.pendingCases ?? 0, icon: Clock, color: "text-yellow-400" },
                    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-400" },
                    { label: "Completed Today", value: stats?.completedToday ?? 0, icon: CheckCircle, color: "text-emerald-400" },
                  ].map(s => (
                    <Card key={s.label}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-between" onClick={() => setActiveTab("users")}>
                        Manage Users <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/reviewer")}>
                        Review Queue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">System Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Role</span>
                        <Badge className={`text-xs ${ROLE_COLORS[user?.role ?? ""] ?? "bg-zinc-700 text-zinc-200"}`}>
                          {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Environment</span>
                        <span className="font-mono text-xs">Production</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {(users ?? []).map((u: any) => (
                  <Card key={u.id}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs ${ROLE_COLORS[u.role] ?? "bg-zinc-700 text-zinc-200"}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                        {SUPER_ROLES.includes(user?.role ?? "") && u.id !== user?.id && (
                          <Select
                            value={u.role}
                            onValueChange={(newRole) => updateRoleMutation.mutate({ userId: u.id, role: newRole as any })}
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client_user">Client</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                              <SelectItem value="coordinator">Coordinator</SelectItem>
                              <SelectItem value="operations_admin">Ops Admin</SelectItem>
                              <SelectItem value="platform_admin">Platform Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!users || users.length === 0) && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No users found</h3>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cases Tab */}
        {activeTab === "cases" && (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Case Management</h3>
            <p className="text-muted-foreground mb-4">Use the Reviewer Dashboard for full case management.</p>
            <Button onClick={() => navigate("/reviewer")}>Go to Reviewer Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}
