import { useLocation } from "wouter";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/config":
        return "Configurations";
      case "/activity":
        return "Activity Log";
      case "/help":
        return "Help & Documentation";
      default:
        return "Dashboard";
    }
  };
  
  return (
    <header className="flex-shrink-0 relative h-16 bg-white flex items-center shadow-sm z-10">
      <div className="flex items-center justify-between w-full px-4 sm:px-6">
        <div className="flex items-center">
          <button 
            type="button" 
            className="md:hidden text-neutral-500 hover:text-neutral-900 focus:outline-none"
            onClick={onMenuToggle}
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>
          <div className="ml-4 md:ml-0">
            <h1 className="text-lg font-medium text-neutral-900">{getPageTitle()}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            className="flex items-center justify-center w-8 h-8 text-neutral-500 rounded-full hover:bg-neutral-100 focus:outline-none"
          >
            <i className="ri-notification-3-line text-xl"></i>
          </button>
          <button 
            type="button" 
            className="flex items-center justify-center w-8 h-8 text-neutral-500 rounded-full hover:bg-neutral-100 focus:outline-none"
          >
            <i className="ri-question-line text-xl"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
