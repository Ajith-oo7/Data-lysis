import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoginButton, LogoutButton } from "./index";
import { User } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RealTimeIndicator } from "@/components/ui/real-time-indicator";

export function AuthHeader() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-9 w-9 rounded-full bg-gray-100/10 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <RealTimeIndicator />
        <LoginButton className="hover-lift" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <RealTimeIndicator />
      <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glassmorphism" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutButton
            variant="ghost"
            className="cursor-pointer w-full justify-start px-2"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
      </div>
    </div>
  );
}