import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  FileText, Shield, Zap, Users, BarChart3, CheckCircle,
  ArrowRight, LogIn, Loader2, Brain
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const role = user?.role ?? "user";
      if (["reviewer", "coordinator", "operations_admin", "platform_admin", "super_admin", "admin"].includes(role)) {
        navigate("/reviewer");
      } else {
        navigate("/requests");
      }
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const features = [
    { icon: Brain, title: "AI-Powered Intake", desc: "Intelligent document analysis and request classification using advanced AI models." },
    { icon: Shield, title: "Role-Based Security", desc: "Six-tier access control from client submission through platform administration." },
    { icon: Zap, title: "Automated Workflows", desc: "Background job orchestration handles intake, validation, and communication automatically." },
    { icon: FileText, title: "Document Management", desc: "Secure upload, validation, and tracking of all supporting documents." },
    { icon: Users, title: "Reviewer Dashboard", desc: "Streamlined case queue, assignment, and review submission for operations teams." },
    { icon: BarChart3, title: "Analytics & Audit", desc: "Complete audit trail and performance metrics for compliance and reporting." },
  ];

  const workflow = [
    { step: "01", title: "Submit Request", desc: "Client submits service request with supporting documents." },
    { step: "02", title: "AI Intake", desc: "AI agent analyzes, classifies, and scores the request automatically." },
    { step: "03", title: "Case Assignment", desc: "Coordinator assigns case to appropriate reviewer based on type and workload." },
    { step: "04", title: "Review & Decision", desc: "Reviewer examines case and submits approval, rejection, or deferral decision." },
    { step: "05", title: "Client Notification", desc: "Client receives automated notification with decision and next steps." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartPRO</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          </nav>
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : isAuthenticated ? (
              <Button onClick={handleGetStarted} size="sm">
                Go to Dashboard <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()} size="sm" variant="outline">
                <LogIn className="w-3 h-3 mr-1" /> Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
            AI-Powered Service Management
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Intelligent Business<br />
            <span className="text-primary">Service Requests</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            SmartPRO automates the full lifecycle of business service requests — from AI-powered intake
            through reviewer assignment, case management, and client communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-base px-8">
              {isAuthenticated ? "Open Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">A complete platform for service request management and workflow automation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground text-lg">From submission to resolution — fully automated and transparent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflow.map((w, i) => (
              <div key={w.step} className="relative">
                <div className="p-5 rounded-xl border border-border bg-card h-full">
                  <div className="text-3xl font-bold text-primary/20 mb-3">{w.step}</div>
                  <h3 className="font-semibold mb-2 text-sm">{w.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 z-10 items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container max-w-2xl mx-auto text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Submit your first service request or sign in to access your dashboard.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-base px-10">
            {isAuthenticated ? "Open Dashboard" : "Sign In to Continue"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SmartPRO</span>
          </div>
          <p>AI-Powered Service Request Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
