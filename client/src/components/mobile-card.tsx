import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn('mobile-card', className)}>
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardHeader({ children, className }: MobileCardHeaderProps) {
  return (
    <div className={cn('mobile-card-header', className)}>
      {children}
    </div>
  );
}

interface MobileCardContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardContent({ children, className }: MobileCardContentProps) {
  return (
    <div className={cn('mobile-card-content', className)}>
      {children}
    </div>
  );
}

interface MobileCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardFooter({ children, className }: MobileCardFooterProps) {
  return (
    <div className={cn('p-4 border-t border-border', className)}>
      {children}
    </div>
  );
}

interface MobileCardActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn('p-4 pt-0 flex justify-end gap-2', className)}>
      {children}
    </div>
  );
}