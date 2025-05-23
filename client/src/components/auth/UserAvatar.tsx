import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FirebaseUser } from "@/lib/firebase";
import { User } from "lucide-react";

interface UserAvatarProps {
  user: FirebaseUser;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ user, className = "", size = "md" }: UserAvatarProps) {
  // Determine size class
  const sizeClass = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base"
  }[size];
  
  // Get initials for fallback
  const getInitials = () => {
    if (!user.displayName) return "U";
    return user.displayName
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Avatar className={`${sizeClass} ring-2 ring-primary/20 ${className}`}>
      {user.photoURL ? (
        <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
      ) : null}
      
      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary-foreground">
        {user.photoURL ? null : user.displayName ? getInitials() : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}