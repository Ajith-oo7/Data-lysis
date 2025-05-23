import { Button, ButtonProps } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/firebase";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean;
  textOverride?: string;
}

export function LoginButton({ 
  className, 
  variant = "default", 
  size = "default",
  showIcon = true,
  textOverride,
  ...props 
}: LoginButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("hover-lift", className)}
      onClick={() => signInWithGoogle()}
      {...props}
    >
      {showIcon && <LogIn className="mr-2 h-4 w-4" />}
      {textOverride || "Sign In"}
    </Button>
  );
}