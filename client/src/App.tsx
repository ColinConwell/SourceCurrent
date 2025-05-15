import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/auth-callback";
import Endpoints from "@/pages/endpoints";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/config" component={Dashboard} />
      <Route path="/activity" component={Dashboard} />
      <Route path="/help" component={Dashboard} />
      <Route path="/endpoints" component={Endpoints} />
      <Route path="/auth/:service/callback" component={AuthCallback} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
