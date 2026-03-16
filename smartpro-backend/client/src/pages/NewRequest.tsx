import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Upload, X, FileText, Loader2, CheckCircle, Zap, LogOut } from "lucide-react";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NewRequest() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [serviceTypeId, setServiceTypeId] = useState<string>("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: serviceTypes, isLoading: typesLoading } = trpc.serviceTypes.list.useQuery();
  const createMutation = trpc.serviceRequests.create.useMutation();
  const uploadMutation = trpc.attachments.upload.useMutation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user?.email && !applicantEmail) setApplicantEmail(user.email);
    if (user?.name && !applicantName) setApplicantName(user.name);
  }, [user]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    const valid = newFiles.filter(f => f.size <= 20 * 1024 * 1024);
    if (valid.length < newFiles.length) toast.warning("Some files exceed 20MB limit and were excluded.");
    setFiles(prev => [...prev, ...valid]);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTypeId) { toast.error("Please select a service type."); return; }
    setIsSubmitting(true);
    try {
      const result = await createMutation.mutateAsync({
        serviceTypeId: parseInt(serviceTypeId),
        titleEn: titleEn || undefined,
        descriptionEn: descriptionEn || undefined,
        applicantName: applicantName || undefined,
        applicantEmail: applicantEmail || undefined,
        applicantPhone: applicantPhone || undefined,
      });
      // Upload files if any
      if (files.length > 0) {
        try {
          // Wait briefly for DB write to complete
          await new Promise(r => setTimeout(r, 800));
          // Retry to find the created request by caseNumber from the list
          const utils = trpc.useUtils();
          const requestList = await utils.serviceRequests.list.fetch({ limit: 5 });
          const created = (requestList as any[])?.find((r: any) => r.caseNumber === result.caseNumber);
          if (created) {
            await Promise.allSettled(
              files.map(async (file) => {
                try {
                  const base64 = await fileToBase64(file);
                  await uploadMutation.mutateAsync({
                    serviceRequestId: created.id,
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    fileSize: file.size,
                    fileBase64: base64,
                    documentType: "other",
                  });
                } catch (uploadErr) {
                  console.warn("File upload failed:", file.name, uploadErr);
                }
              })
            );
          }
        } catch (listErr) {
          console.warn("Could not fetch request for file upload:", listErr);
        }
      }
      setCaseNumber(result.caseNumber);
      setSubmitted(true);
      toast.success(`Request ${result.caseNumber} submitted successfully!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
            <p className="text-muted-foreground mb-4">Your service request has been received and is being processed by our AI intake system.</p>
            <Badge variant="outline" className="text-lg px-4 py-2 mb-8 border-primary/30 text-primary font-mono">
              {caseNumber}
            </Badge>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/requests")}>View My Requests</Button>
              <Button variant="outline" onClick={() => { setSubmitted(false); setServiceTypeId(""); setTitleEn(""); setDescriptionEn(""); setFiles([]); }}>
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <span className="text-muted-foreground text-sm hidden sm:block">/ New Request</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Service Request</h1>
          <p className="text-muted-foreground">Fill in the details below. Our AI will automatically process and classify your request.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Service Type</CardTitle>
              <CardDescription>Select the type of service you require.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={serviceTypeId} onValueChange={setServiceTypeId} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={typesLoading ? "Loading..." : "Select a service type"} />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes?.map(st => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      {st.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="title" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Brief title for your request" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="description" value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} placeholder="Describe your request in detail..." rows={5} className="mt-1.5 resize-none" />
              </div>
            </CardContent>
          </Card>

          {/* Applicant Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Applicant Information</CardTitle>
              <CardDescription>Contact details for this request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="Your full name" className="mt-1.5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={applicantEmail} onChange={e => setApplicantEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={applicantPhone} onChange={e => setApplicantPhone(e.target.value)} placeholder="+968 XXXX XXXX" className="mt-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Supporting Documents</CardTitle>
              <CardDescription>Upload any relevant documents (max 20MB each).</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOCX up to 20MB</span>
                <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.doc" onChange={handleFileAdd} />
              </label>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !serviceTypeId}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <>Submit Request</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
