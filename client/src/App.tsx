import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/auth-callback";
import Endpoints from "@/pages/endpoints";
import Integrations from "@/pages/integrations";
import Configurations from "@/pages/configurations";
import Activity from "@/pages/activity";
import Help from "@/pages/help";
import { DebugPanel } from "@/components/debug/debug-panel";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/config" component={Configurations} />
      <Route path="/activity" component={Activity} />
      <Route path="/help" component={Help} />
      <Route path="/endpoints" component={Endpoints} />
      <Route path="/integrations" component={Integrations} />
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
        <DebugPanel />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
