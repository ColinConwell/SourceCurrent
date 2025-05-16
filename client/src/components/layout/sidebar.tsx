import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [devMode, setDevMode] = useState(false);
  
  // Load dev mode from localStorage on mount
  useEffect(() => {
    const savedDevMode = localStorage.getItem('developmentMode');
    if (savedDevMode) {
      setDevMode(savedDevMode === 'true');
    }
  }, []);
  
  // Save dev mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('developmentMode', devMode.toString());
  }, [devMode]);
  
  const handleToggleDevMode = () => {
    setDevMode(prev => !prev);
  };

  // Create a dynamic menu items array based on development mode
  const baseMenuItems = [
    { label: "Dashboard", icon: "ri-dashboard-line", path: "/" },
    { label: "Endpoints", icon: "ri-api-line", path: "/endpoints" },
    { label: "Integrations", icon: "ri-link-m", path: "/integrations" },
    { label: "Configurations", icon: "ri-settings-3-line", path: "/config" },
    { label: "Activity Log", icon: "ri-history-line", path: "/activity" },
    { label: "Help & Docs", icon: "ri-information-line", path: "/help" },
  ];
  
  // Add Development page item if dev mode is enabled
  const devMenuItem = { label: "Development", icon: "ri-code-box-line", path: "/dev" };
  
  const menuItems = devMode 
    ? [...baseMenuItems, devMenuItem] 
    : baseMenuItems;

  return (
    <div className={cn("hidden md:flex md:flex-shrink-0", className)}>
      <div className="flex flex-col w-64 border-r border-neutral-200 bg-white">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center">
              <i className="ri-database-2-line text-white text-xl"></i>
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">
              DataConnect
            </h1>
          </div>
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "menu-item flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.path ? "active" : "text-neutral-600",
                )}
              >
                <i className={cn(item.icon, "mr-3 text-lg")}></i>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-neutral-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-700">JS</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-neutral-700">
                  Example User
                </p>
                <p className="text-xs font-medium text-neutral-500">
                  Administrator
                </p>
              </div>
            </div>
            
            {/* Development Mode Toggle */}
            <div className="flex items-center justify-between mt-4 px-1">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="dev-mode" 
                  checked={devMode}
                  onCheckedChange={handleToggleDevMode}
                />
                <Label htmlFor="dev-mode" className="text-xs font-medium text-neutral-600 cursor-pointer">
                  Development Mode
                </Label>
              </div>
              {devMode && <span className="text-xs text-green-600">Active</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
