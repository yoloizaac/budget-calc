import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  className?: string;
}

export function KPICard({ icon: Icon, label, children, variant = 'default', className }: KPICardProps) {
  const variantClasses = {
    default: 'border-border/50',
    success: 'border-l-4 border-l-success-foreground',
    destructive: 'border-l-4 border-l-destructive',
    warning: 'border-l-4 border-l-warning-foreground',
  };

  const iconBg = {
    default: 'bg-secondary/10 text-secondary',
    success: 'bg-success text-success-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning text-warning-foreground',
  };

  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-shadow duration-200', variantClasses[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className={cn('h-7 w-7 rounded-full flex items-center justify-center', iconBg[variant])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}
