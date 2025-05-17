import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuToggle: () => void;
  className?: string;
  pageTitle?: string;
}

export default function Navbar({ onMenuToggle, className, pageTitle = "Dashboard" }: NavbarProps) {
  return (
    <nav className={cn(
      "bg-white border-b border-neutral-200 h-16 px-4 flex items-center justify-between md:justify-end",
      className
    )}>
      {/* Menu toggle button - only visible on mobile */}
      <button 
        className="flex md:hidden items-center justify-center text-neutral-700 hover:text-primary-500 focus:outline-none"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <i className="ri-menu-line text-2xl"></i>
      </button>
      
      {/* Page title - only visible on mobile */}
      <div className="md:hidden font-medium text-lg">{pageTitle}</div>
      
      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        <button className="text-neutral-600 hover:text-primary-500 focus:outline-none">
          <i className="ri-notification-3-line text-xl"></i>
        </button>
        <button className="text-neutral-600 hover:text-primary-500 focus:outline-none">
          <i className="ri-search-line text-xl"></i>
        </button>
        <button className="text-neutral-600 hover:text-primary-500 focus:outline-none">
          <i className="ri-settings-3-line text-xl"></i>
        </button>
      </div>
    </nav>
  );
}
