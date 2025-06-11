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
  FolderOpen,
  LayoutDashboard,
  Palette,
  Code2,
  Brain,
  Zap,
  Users,
  History,
  Database,
  Cloud,
  Webhook,
  BarChart3,
  TrendingUp,
  Shield,
  Bell,
  Moon,
  Sun,
  Monitor,
  Accessibility,
  Type,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Step } from "@/types";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { currentStep, setCurrentStep, fileInfo } = useAppContext();
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode, fontSize, setFontSize, themeName } = useTheme();
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

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

  const NavItem = ({ step, icon, label, badge, external }: { step?: Step; icon: React.ReactNode; label: string; badge?: string; external?: boolean }) => {
    const isActive = currentStep === step;
    const isDisabled = (step && step !== 'upload' && !fileInfo.file);
    
    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start text-left font-normal relative overflow-hidden group transition-all duration-300",
          isActive && "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium",
          isDisabled && "opacity-40 cursor-not-allowed",
          !isDisabled && !isActive && "hover:bg-gray-50/20"
        )}
        onClick={() => !isDisabled && step && handleNavigation(step)}
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
          "ml-2 transition-all duration-300 flex-1",
          !isDisabled && !isActive && "group-hover:text-primary group-hover:translate-x-1"
        )}>
          {label}
        </span>
        
        {/* Badge */}
        {badge && (
          <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
            {badge}
          </Badge>
        )}
        
        {/* Status indicator */}
        {!badge && (isActive ? (
          <span className="ml-auto flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </span>
        ) : (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-300/50" />
        ))}
        
        {/* Hover effect overlay */}
        {!isDisabled && !isActive && (
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/0 to-accent/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        )}
      </Button>
    );
  };

  const LinkItem = ({ href, icon, label, badge, isActive = false }: { href: string; icon: React.ReactNode; label: string; badge?: string; isActive?: boolean }) => (
    <Link href={href} className="block">
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start text-left font-normal hover-lift hover-shadow relative overflow-hidden group",
          isActive && "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-accent animate-pulse-slow" />
        )}
        <span className="group-hover:text-primary transition-colors">{icon}</span>
        <span className="ml-2 group-hover:translate-x-1 transition-transform flex-1">{label}</span>
        {badge && (
          <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
            {badge}
          </Badge>
        )}
      </Button>
    </Link>
  );

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
          
          <Separator className="my-4" />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2">Advanced Tools</div>
          
          <LinkItem 
            href="/python-scripting"
            icon={<Code2 className="h-5 w-5" />}
            label="Python Scripting"
            badge="NEW"
            isActive={window.location.pathname === "/python-scripting"}
          />
          
          <LinkItem 
            href="/sql-query"
            icon={<Database className="h-5 w-5" />}
            label="SQL Query Platform"
            badge="NEW"
            isActive={window.location.pathname === "/sql-query"}
          />
          
          <LinkItem 
            href="/ml-recommendations"
            icon={<Brain className="h-5 w-5" />}
            label="ML Recommendations"
            badge="AI"
            isActive={window.location.pathname === "/ml-recommendations"}
          />
          
          <LinkItem 
            href="/predictive-analytics"
            icon={<TrendingUp className="h-5 w-5" />}
            label="Predictive Analytics"
            badge="PRO"
            isActive={window.location.pathname === "/predictive-analytics"}
          />
          
          <LinkItem 
            href="/data-quality"
            icon={<Shield className="h-5 w-5" />}
            label="Data Quality"
            badge="NEW"
            isActive={window.location.pathname === "/data-quality"}
          />
          
          <LinkItem 
            href="/natural-language"
            icon={<MessageSquare className="h-5 w-5" />}
            label="Natural Language Query"
            badge="AI"
            isActive={window.location.pathname === "/natural-language"}
          />
          
          <LinkItem 
            href="/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Custom Dashboard"
            isActive={window.location.pathname === "/custom-dashboard"}
          />
          
          <Separator className="my-4" />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2">Data Sources</div>
          
          <LinkItem 
            href="/database-connector"
            icon={<Database className="h-5 w-5" />}
            label="Database Connector"
            isActive={window.location.pathname === "/database-connector"}
          />
          
          <LinkItem 
            href="/cloud-storage"
            icon={<Cloud className="h-5 w-5" />}
            label="Cloud Storage"
            isActive={window.location.pathname === "/cloud-storage"}
          />
          
          <LinkItem 
            href="/api-integration"
            icon={<Webhook className="h-5 w-5" />}
            label="API Integration"
            isActive={window.location.pathname === "/api-integration"}
          />
          
          <Separator className="my-4" />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2">Collaboration</div>
          
          <LinkItem 
            href="/team-workspace"
            icon={<Users className="h-5 w-5" />}
            label="Team Workspace"
            badge="BETA"
            isActive={window.location.pathname === "/team-workspace"}
          />
          
          <LinkItem 
            href="/audit-trail"
            icon={<History className="h-5 w-5" />}
            label="Audit Trail"
            isActive={window.location.pathname === "/audit-trail"}
          />
          
          <LinkItem 
            href="/sharing"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Dashboard Sharing"
            isActive={window.location.pathname === "/sharing"}
          />
          
          <Separator className="my-4" />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2 flex items-center justify-between">
            <span>Theme & Settings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-6 w-6 p-0"
            >
              {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal text-sm py-1 h-8"
              onClick={() => setFontSize(fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : 'small')}
            >
              <Type className="h-4 w-4 mr-2" />
              Font: {fontSize}
            </Button>
            
            <LinkItem 
              href="/accessibility"
              icon={<Accessibility className="h-4 w-4" />}
              label="Accessibility"
              isActive={window.location.pathname === "/accessibility"}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mt-8 mb-3 ml-2">Resources</div>
          
          <LinkItem 
            href="/"
            icon={<BarChart2 className="h-5 w-5" />}
            label="Homepage"
            isActive={window.location.pathname === "/"}
          />
          
          <LinkItem 
            href="/files"
            icon={<FolderOpen className="h-5 w-5" />}
            label="My Files"
            badge={user ? "●" : undefined}
            isActive={window.location.pathname === "/files"}
          />
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-left font-normal hover-lift hover-shadow group"
            onClick={() => window.open('https://github.com/your-repo/datalysis', '_blank')}
          >
            <HelpCircle className="h-5 w-5 group-hover:text-primary transition-colors" />
            <span className="ml-2 group-hover:translate-x-1 transition-transform">Help & Docs</span>
          </Button>
        </nav>
        
        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-100/20">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {themeName} theme
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!user && (
          <div className="p-4 border-t border-gray-100/20">
            <Button 
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full hover-lift hover-shadow"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
