import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ className, isOpen, onClose }: SidebarProps) {
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

  // Handle clicking a menu item on mobile - close sidebar
  const handleMenuItemClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center">
                <i className="ri-database-2-line text-white text-xl"></i>
              </div>
              <h1 className="text-lg font-semibold text-neutral-900">
                DataConnect
              </h1>
            </div>
            
            {/* Close button - only on mobile */}
            <button 
              className="md:hidden ml-auto text-neutral-500 hover:text-neutral-700"
              onClick={onClose}
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="flex flex-col flex-grow overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={handleMenuItemClick}
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
              <div className="flex flex-col mt-4 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="dev-mode" className="text-sm font-medium text-neutral-700 cursor-pointer">
                    Development Mode
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${devMode ? 'text-green-600 font-semibold' : 'text-neutral-500'}`}>
                      {devMode ? 'Active' : 'Inactive'}
                    </span>
                    <Switch 
                      id="dev-mode" 
                      checked={devMode}
                      onCheckedChange={handleToggleDevMode}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500">
                  Enable advanced features for development and testing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
