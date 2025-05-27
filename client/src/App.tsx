import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
import Development from "@/pages/dev";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";

function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  
  // Update page title based on current location
  useEffect(() => {
    const getTitleFromPath = (path: string) => {
      switch (path) {
        case "/": return "Dashboard";
        case "/config": return "Configurations";
        case "/activity": return "Activity Log";
        case "/help": return "Help & Docs";
        case "/endpoints": return "Endpoints";
        case "/integrations": return "Integrations";
        case "/dev": return "Development";
        default: return "Dashboard";
      }
    };
    
    setPageTitle(getTitleFromPath(location));
  }, [location]);
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Navbar onMenuToggle={toggleSidebar} pageTitle={pageTitle} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/config" component={Configurations} />
            <Route path="/activity" component={Activity} />
            <Route path="/help" component={Help} />
            <Route path="/endpoints" component={Endpoints} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/dev" component={Development} />
            <Route path="/auth/:service/callback" component={AuthCallback} />
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
