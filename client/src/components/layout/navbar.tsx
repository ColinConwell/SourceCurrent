import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuToggle: () => void;
  className?: string;
  pageTitle?: string;
}

export default function Navbar({ onMenuToggle, className, pageTitle = "Dashboard" }: NavbarProps) {
  return (
    <nav className={cn(
      "bg-white border-b border-neutral-200 h-16 px-4 flex items-center justify-between lg:justify-end",
      className
    )}>
      {/* Menu toggle button - visible on mobile and tablet */}
      <button 
        className="flex lg:hidden items-center justify-center text-neutral-700 hover:text-primary-500 focus:outline-none p-2"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {/* Page title - visible on mobile and tablet */}
      <div className="lg:hidden font-medium text-lg">{pageTitle}</div>
      
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
