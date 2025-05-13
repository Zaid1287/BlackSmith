import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileActionButtonProps extends ButtonProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

/**
 * A specialized button component for mobile action buttons
 * with enhanced touch feedback and larger touch targets
 */
export function MobileActionButton({
  label,
  icon,
  active = false,
  className,
  ...props
}: MobileActionButtonProps) {
  return (
    <Button
      className={cn(
        // Base styles with improved tap target and visual feedback
        "relative inline-flex flex-col items-center justify-center gap-1 p-2",
        "min-w-[60px] min-h-[50px] w-full",
        "rounded-lg overflow-hidden",
        // Z-index to ensure it's clickable
        "z-20",
        // Enhanced visual feedback for touch
        "transition-all duration-100",
        "active:opacity-80 active:transform active:scale-95",
        // Different styling based on active state
        active
          ? "bg-primary/10 text-primary border-primary/20 border"
          : "bg-background hover:bg-muted/50",
        className
      )}
      {...props}
    >
      {/* Add an extra touch feedback overlay */}
      <span className="absolute inset-0 bg-transparent active:bg-muted/30 touch-manipulation" />
      
      {/* Content */}
      <div className="flex flex-col items-center justify-center pointer-events-none">
        {icon && <div className="mb-1">{icon}</div>}
        <span className="text-xs font-medium">{label}</span>
      </div>
    </Button>
  );
}