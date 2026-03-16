import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Search, Loader2, Zap, LogOut, ArrowRight, ClipboardList,
  Clock, CheckCircle, XCircle, AlertCircle, Users
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-700 text-zinc-200",
  medium: "bg-blue-900 text-blue-200",
  high: "bg-orange-900 text-orange-200",
  urgent: "bg-red-900 text-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-900 text-blue-200",
  assigned: "bg-yellow-900 text-yellow-200",
  in_review: "bg-purple-900 text-purple-200",
  pending_info: "bg-orange-900 text-orange-200",
  approved: "bg-emerald-900 text-emerald-200",
  rejected: "bg-red-900 text-red-200",
  deferred: "bg-zinc-700 text-zinc-200",
  closed: "bg-zinc-800 text-zinc-400",
};

const ADMIN_ROLES = ["reviewer", "coordinator", "operations_admin", "platform_admin", "super_admin", "admin"];

export default function ReviewerDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: cases, isLoading } = trpc.serviceCases.queue.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    limit: 100,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && isAuthenticated && user && !ADMIN_ROLES.includes(user.role ?? "")) {
      navigate("/requests");
    }
  }, [authLoading, isAuthenticated, user]);

  const filtered = (cases ?? []).filter((c: any) =>
    !search ||
    (c.caseNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.request?.titleEn ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.request?.applicantName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: cases?.length ?? 0,
    open: (cases ?? []).filter((c: any) => c.status === "open").length,
    inReview: (cases ?? []).filter((c: any) => c.status === "in_review" || c.status === "assigned").length,
    urgent: (cases ?? []).filter((c: any) => c.priority === "urgent").length,
  };

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
            <span className="text-muted-foreground text-sm hidden sm:block">/ Reviewer Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {(user?.role === "platform_admin" || user?.role === "super_admin" || user?.role === "admin") && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="gap-2 hidden sm:flex">
                <Users className="w-3.5 h-3.5" /> Admin
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Cases", value: stats.total, icon: ClipboardList, color: "text-foreground" },
            { label: "Open", value: stats.open, icon: Clock, color: "text-blue-400" },
            { label: "In Review", value: stats.inReview, icon: AlertCircle, color: "text-yellow-400" },
            { label: "Urgent", value: stats.urgent, icon: XCircle, color: "text-red-400" },
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by case number, title, or applicant..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="pending_info">Pending Info</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cases Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No cases found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:border-primary/30 transition-colors group"
                onClick={() => navigate(`/reviewer/cases/${c.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary font-medium">{c.caseNumber}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[c.status] ?? "bg-zinc-700 text-zinc-200"}`}>
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge className={`text-xs ${PRIORITY_COLORS[c.priority] ?? "bg-zinc-700 text-zinc-200"}`}>
                        {c.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{c.request?.titleEn || "Untitled Request"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.request?.applicantName || "Unknown applicant"} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
