import { Button, ButtonProps } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean;
  textOverride?: string;
}

export function LogoutButton({
  className,
  variant = "outline",
  size = "default",
  showIcon = true,
  textOverride,
  ...props
}: LogoutButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("hover-lift", className)}
      onClick={() => auth.signOut()}
      {...props}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {textOverride || "Sign Out"}
    </Button>
  );
}