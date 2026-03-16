import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewRequest from "./pages/NewRequest";
import MyRequests from "./pages/MyRequests";
import RequestDetail from "./pages/RequestDetail";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import CaseDetail from "./pages/CaseDetail";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/requests/new" component={NewRequest} />
      <Route path="/requests" component={MyRequests} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/reviewer" component={ReviewerDashboard} />
      <Route path="/reviewer/cases/:id" component={CaseDetail} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
