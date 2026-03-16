import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Plus, Search, FileText, Loader2, Zap, LogOut, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-200",
  submitted: "bg-blue-900 text-blue-200",
  intake_processing: "bg-yellow-900 text-yellow-200",
  intake_complete: "bg-cyan-900 text-cyan-200",
  pending_info: "bg-orange-900 text-orange-200",
  under_review: "bg-purple-900 text-purple-200",
  approved: "bg-emerald-900 text-emerald-200",
  rejected: "bg-red-900 text-red-200",
  completed: "bg-green-900 text-green-200",
  cancelled: "bg-zinc-800 text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  intake_processing: "AI Processing",
  intake_complete: "AI Complete",
  pending_info: "Pending Info",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyRequests() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: requests, isLoading } = trpc.serviceRequests.list.useQuery({ limit: 50 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const filtered = requests?.filter(r =>
    !search ||
    (r.caseNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.titleEn ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

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
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-10">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Requests</h1>
            <p className="text-muted-foreground mt-1">Track and manage your service requests.</p>
          </div>
          <Button onClick={() => navigate("/requests/new")} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by case number or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No requests yet</h3>
              <p className="text-muted-foreground mb-6">Submit your first service request to get started.</p>
              <Button onClick={() => navigate("/requests/new")} className="gap-2">
                <Plus className="w-4 h-4" /> New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <Card
                key={req.id}
                className="cursor-pointer hover:border-primary/30 transition-colors group"
                onClick={() => navigate(`/requests/${req.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary font-medium">{req.caseNumber}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[req.status] ?? "bg-zinc-700 text-zinc-200"}`}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{req.titleEn || "Untitled Request"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
