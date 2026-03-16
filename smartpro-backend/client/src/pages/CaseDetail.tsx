import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, Zap, LogOut, ArrowLeft, FileText, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-900 text-blue-200",
  assigned: "bg-yellow-900 text-yellow-200",
  in_review: "bg-purple-900 text-purple-200",
  pending_info: "bg-orange-900 text-orange-200",
  approved: "bg-emerald-900 text-emerald-200",
  rejected: "bg-red-900 text-red-200",
  deferred: "bg-zinc-700 text-zinc-200",
  resolved: "bg-emerald-900 text-emerald-200",
  closed: "bg-zinc-800 text-zinc-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-700 text-zinc-200",
  medium: "bg-blue-900 text-blue-200",
  high: "bg-orange-900 text-orange-200",
  urgent: "bg-red-900 text-red-200",
};

const REVIEWER_ROLES = ["reviewer", "coordinator", "operations_admin", "platform_admin", "super_admin", "admin"];

export default function CaseDetail() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const caseId = parseInt(params.id ?? "0");

  const [decision, setDecision] = useState<"approved" | "rejected" | "deferred" | "">("");
  const [decisionReason, setDecisionReason] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: serviceCase, isLoading, refetch } = trpc.serviceCases.get.useQuery(
    { id: caseId },
    { enabled: !!caseId }
  );

  const submitReviewMutation = trpc.serviceCases.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully");
      refetch();
      setDecision("");
      setDecisionReason("");
      setReviewerNotes("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  const updatePriorityMutation = trpc.serviceCases.updatePriority.useMutation({
    onSuccess: () => {
      toast.success("Priority updated");
      refetch();
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && isAuthenticated && user && !REVIEWER_ROLES.includes(user.role ?? "")) {
      navigate("/requests");
    }
  }, [authLoading, isAuthenticated, user]);

  const handleSubmitReview = async () => {
    if (!decision || decisionReason.length < 10) {
      toast.error("Please select a decision and provide a reason (min 10 characters)");
      return;
    }
    setSubmitting(true);
    try {
      await submitReviewMutation.mutateAsync({
        caseId,
        decision,
        decisionReason,
        reviewerNotes: reviewerNotes || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!serviceCase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
          <Button onClick={() => navigate("/reviewer")} variant="outline">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const c = serviceCase as any;
  const req = c.request;
  const isResolved = c.status === "resolved" || c.status === "closed";

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
            <span className="text-muted-foreground text-sm hidden sm:block">/ Case Detail</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto py-8">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/reviewer")} className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-primary font-semibold">{c.caseNumber}</span>
            <Badge className={`text-xs ${STATUS_COLORS[c.status] ?? "bg-zinc-700 text-zinc-200"}`}>
              {c.status.replace(/_/g, " ")}
            </Badge>
            <Badge className={`text-xs ${PRIORITY_COLORS[c.priority] ?? "bg-zinc-700 text-zinc-200"}`}>
              {c.priority}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Title</p>
                  <p className="font-medium">{req?.titleEn || "Untitled"}</p>
                  {req?.titleAr && <p className="text-sm text-muted-foreground mt-1 text-right" dir="rtl">{req.titleAr}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{req?.descriptionEn || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Applicant</p>
                    <p className="text-sm font-medium">{req?.applicantName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm">{req?.applicantEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm">{req?.applicantPhone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="text-sm">{req?.submittedAt ? new Date(req.submittedAt).toLocaleDateString("en-GB") : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {req?.aiSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" /> AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Summary</p>
                    <p className="text-sm leading-relaxed">{req.aiSummary}</p>
                  </div>
                  {req.aiConfidenceScore && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Confidence Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Number(req.aiConfidenceScore)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono">{Number(req.aiConfidenceScore).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                  {req.aiFlags && Array.isArray(req.aiFlags) && req.aiFlags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Flags</p>
                      <div className="flex flex-wrap gap-2">
                        {(req.aiFlags as string[]).map((flag: string) => (
                          <Badge key={flag} variant="outline" className="text-xs">{flag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {c.attachments && c.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Documents ({c.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {c.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors group"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.originalName || att.fileName}</p>
                          <p className="text-xs text-muted-foreground">{att.mimeType}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Communications */}
            {c.communications && c.communications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Communications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {c.communications.map((comm: any) => (
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

            {/* Review Decision Form */}
            {!isResolved && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Submit Review Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Decision *</Label>
                    <Select value={decision} onValueChange={(v) => setDecision(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                        <SelectItem value="deferred">Defer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Decision Reason * (min 10 characters)</Label>
                    <Textarea
                      placeholder="Provide a clear reason for your decision..."
                      value={decisionReason}
                      onChange={e => setDecisionReason(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{decisionReason.length}/2000</p>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Reviewer Notes (optional)</Label>
                    <Textarea
                      placeholder="Internal notes for the team..."
                      value={reviewerNotes}
                      onChange={e => setReviewerNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitting || !decision || decisionReason.length < 10}
                    className="w-full"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Decision
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Resolved State */}
            {isResolved && c.decision && (
              <Card className="border-emerald-800/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Review Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Decision</p>
                    <Badge className={c.decision === "approved" ? "bg-emerald-900 text-emerald-200" : "bg-red-900 text-red-200"}>
                      {c.decision.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm">{c.decisionReason}</p>
                  </div>
                  {c.reviewerNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{c.reviewerNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Case Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`text-xs ${STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Priority</span>
                  <Select
                    value={c.priority}
                    onValueChange={(v) => updatePriorityMutation.mutate({ caseId, priority: v as any })}
                    disabled={isResolved}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(c.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
                {c.decisionAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decided</span>
                    <span>{new Date(c.decisionAt).toLocaleDateString("en-GB")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
