import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { 
  BarChart2, 
  Upload, 
  Settings, 
  FileBarChart, 
  MessageSquare, 
  HelpCircle, 
  Video, 
  ChevronLeft, 
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Step } from "@/types";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { currentStep, setCurrentStep, fileInfo } = useAppContext();
  const { user } = useAuth();

  const handleNavigation = (step: Step) => {
    // Only allow navigation to steps that make sense based on current state
    if (step === 'upload') {
      setCurrentStep(step);
    } else if (step === 'preprocess' && fileInfo.file) {
      setCurrentStep(step);
    } else if (step === 'results' && fileInfo.file) {
      setCurrentStep(step);
    } else if (step === 'query' && fileInfo.file) {
      setCurrentStep(step);
    }
  };

  const NavItem = ({ step, icon, label }: { step: Step; icon: React.ReactNode; label: string }) => {
    const isActive = currentStep === step;
    const isDisabled = (step !== 'upload' && !fileInfo.file);
    
    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start text-left font-normal relative overflow-hidden group transition-all duration-300",
          isActive && "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium",
          isDisabled && "opacity-40 cursor-not-allowed",
          !isDisabled && !isActive && "hover:bg-gray-50/20"
        )}
        onClick={() => !isDisabled && handleNavigation(step)}
        disabled={isDisabled}
      >
        {/* Animated indicator line for active state */}
        {isActive && (
          <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-accent animate-pulse-slow" />
        )}
        
        {/* Icon with animation on hover */}
        <span className={cn(
          "flex items-center justify-center transition-transform duration-300",
          !isDisabled && !isActive && "group-hover:scale-110"
        )}>
          {icon}
        </span>
        
        {/* Label with transition effect */}
        <span className={cn(
          "ml-2 transition-all duration-300",
          !isDisabled && !isActive && "group-hover:text-primary group-hover:translate-x-1"
        )}>
          {label}
        </span>
        
        {/* Status indicator */}
        {isActive ? (
          <span className="ml-auto flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </span>
        ) : (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-300/50" />
        )}
        
        {/* Hover effect overlay */}
        {!isDisabled && !isActive && (
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/0 to-accent/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        )}
      </Button>
    );
  };

  return (
    <aside 
      className={cn(
        "glassmorphism w-64 flex-shrink-0 fixed md:sticky top-0 h-screen border-r border-gray-100/20 z-10 transition-all duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100/20 relative overflow-hidden">
          <div className="relative z-10 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-slow">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gradient text-lg">DataLysis</span>
          </div>
          
          {/* Background decorative element */}
          <div className="absolute -right-6 -bottom-10 w-20 h-20 bg-accent/10 rounded-full blur-xl"></div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden relative z-10 hover-lift"
            onClick={() => setOpen(false)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2">Interactive Workflow</div>
          
          <NavItem 
            step="upload" 
            icon={<Upload className={cn("h-5 w-5", currentStep === 'upload' && "text-primary animate-pulse-slow")} />} 
            label="Upload Data" 
          />
          <NavItem 
            step="preprocess" 
            icon={<Settings className={cn("h-5 w-5", currentStep === 'preprocess' && "text-primary animate-pulse-slow")} />} 
            label="Preprocess" 
          />
          <NavItem 
            step="results" 
            icon={<FileBarChart className={cn("h-5 w-5", currentStep === 'results' && "text-primary animate-pulse-slow")} />} 
            label="Results" 
          />
          <NavItem 
            step="query" 
            icon={<MessageSquare className={cn("h-5 w-5", currentStep === 'query' && "text-primary animate-pulse-slow")} />} 
            label="Query Data" 
          />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mt-8 mb-3 ml-2">Resources</div>
          
          <Link href="/" className="block">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-left font-normal hover-lift hover-shadow relative overflow-hidden group",
                window.location.pathname === "/" && "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium"
              )}
            >
              {window.location.pathname === "/" && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-accent animate-pulse-slow" />
              )}
              <BarChart2 className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span className="ml-2 group-hover:translate-x-1 transition-transform">Homepage</span>
            </Button>
          </Link>
          
          <Link href="/files" className="block">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-left font-normal hover-lift hover-shadow relative overflow-hidden group",
                window.location.pathname === "/files" && "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium"
              )}
            >
              {window.location.pathname === "/files" && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-accent animate-pulse-slow" />
              )}
              <FolderOpen className="h-5 w-5 group-hover:text-primary transition-colors" />
              <span className="ml-2 group-hover:translate-x-1 transition-transform">My Files</span>
              {user && (
                <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </Link>
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mt-6 mb-3 ml-2">Help</div>
          
          <Button variant="ghost" className="w-full justify-start text-left font-normal hover-lift hover-shadow group">
            <HelpCircle className="h-5 w-5 group-hover:text-primary transition-colors" />
            <span className="ml-2 group-hover:translate-x-1 transition-transform">Documentation</span>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start text-left font-normal hover-lift hover-shadow group">
            <Video className="h-5 w-5 group-hover:text-primary transition-colors" />
            <span className="ml-2 group-hover:translate-x-1 transition-transform">Tutorials</span>
          </Button>
        </nav>
        
        {/* User */}
        <div className="border-t border-gray-100/20 p-4 relative">
          <div className="absolute -left-6 -top-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-50/30 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user.displayName || "User"}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                      {user.email ? user.email.split('@')[0] : "signed in"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-1">
                <p className="text-xs text-gray-500 mb-2">Sign in to save your files</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full glassmorphism hover:bg-background/50 text-sm"
                  onClick={() => signInWithGoogle()}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
