import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FirebaseUser, signOut } from "@/lib/firebase";
import { UserAvatar } from "./UserAvatar";
import { FileIcon, LogOut, Settings, User } from "lucide-react";

interface UserProfileMenuProps {
  user: FirebaseUser;
  onSignOut?: () => void;
}

export function UserProfileMenu({ user, onSignOut }: UserProfileMenuProps) {
  const handleSignOut = async () => {
    await signOut();
    if (onSignOut) onSignOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-2 p-1.5 rounded-full transition-colors hover:bg-accent/10 cursor-pointer glassmorphism border border-gray-200/20">
          <UserAvatar user={user} size="sm" />
          <span className="font-medium text-sm mr-1 hidden md:inline-block max-w-[100px] truncate">
            {user.displayName || "User"}
          </span>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 glassmorphism border-gray-200/20" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.displayName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          <span>My Files</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive flex items-center gap-2 focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}