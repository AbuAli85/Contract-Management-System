import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import {
  ArrowLeft, FileText, Loader2, Zap, Calendar, User, Mail, Phone, Brain,
  MessageSquare, LogOut, XCircle
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-200",
  submitted: "bg-blue-900 text-blue-200",
  intake_processing: "bg-yellow-900 text-yellow-200",
  intake_complete: "bg-cyan-900 text-cyan-200",
  under_review: "bg-purple-900 text-purple-200",
  pending_info: "bg-orange-900 text-orange-200",
  approved: "bg-emerald-900 text-emerald-200",
  rejected: "bg-red-900 text-red-200",
  cancelled: "bg-zinc-800 text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  intake_processing: "AI Processing",
  intake_complete: "AI Complete",
  under_review: "Under Review",
  pending_info: "Pending Info",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function RequestDetail() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");

  const { data: request, isLoading, refetch } = trpc.serviceRequests.get.useQuery(
    { id },
    { enabled: !!id }
  );

  const cancelMutation = trpc.serviceRequests.cancel.useMutation({
    onSuccess: () => {
      toast.success("Request cancelled");
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to cancel request"),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
          <Button onClick={() => navigate("/requests")} variant="outline" className="mt-4">Back to Requests</Button>
        </div>
      </div>
    );
  }

  const aiResult = request.aiFlags as any;
  const attachments = (request as any).attachments ?? [];
  const communications = (request as any).communications ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded bg-primary flex items-center justify-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">SmartPRO</span>
            <span className="text-muted-foreground text-sm hidden sm:block">/ Request Detail</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl mx-auto py-8">
        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/requests")} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-primary font-semibold text-lg">{request.caseNumber}</span>
              <Badge className={`${STATUS_COLORS[request.status] ?? "bg-zinc-700 text-zinc-200"}`}>
                {STATUS_LABELS[request.status] ?? request.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{request.titleEn || "Untitled Request"}</h1>
          </div>
          {["draft", "submitted"].includes(request.status) && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
              onClick={() => cancelMutation.mutate({ id: request.id })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                : <XCircle className="w-3.5 h-3.5 mr-1.5" />
              }
              Cancel Request
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {/* Description */}
          {request.descriptionEn && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{request.descriptionEn}</p>
              </CardContent>
            </Card>
          )}

          {/* Applicant */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{request.applicantName || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{request.applicantEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>{request.applicantPhone || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Submitted</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{new Date(request.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">AI Confidence</p>
                {request.aiConfidenceScore ? (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Number(request.aiConfidenceScore)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{Number(request.aiConfidenceScore).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {request.aiSummary && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> AI Intake Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Summary</p>
                  <p className="leading-relaxed">{request.aiSummary}</p>
                </div>
                {aiResult && Array.isArray(aiResult) && aiResult.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {(aiResult as string[]).map((flag: string) => (
                        <Badge key={flag} variant="outline" className="text-xs">{flag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Documents ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((att: any) => (
                    <a
                      key={att.id}
                      href={att.storageUrl || att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.originalName || att.filename}</p>
                        <p className="text-xs text-muted-foreground">{att.mimeType}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Communications */}
          {communications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Updates & Communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {communications.map((comm: any) => (
                    <div key={comm.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">{comm.subject}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comm.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      <p className="text-sm">{comm.bodyEn}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
