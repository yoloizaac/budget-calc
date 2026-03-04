import { ReactNode, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  icon: string;
  label: string;
  isOk: boolean;
  message: string;
  details?: ReactNode;
  className?: string;
}

export function AlertCard({ icon, label, isOk, message, details, className }: AlertCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(
        'shadow-sm border-border/50 transition-all duration-200 hover:shadow-md',
        isOk ? 'bg-success/30' : 'bg-warning/30',
        className
      )}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 flex items-center gap-3 cursor-pointer">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0',
              isOk ? 'bg-success-foreground/20' : 'bg-warning-foreground/20'
            )}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className={cn('inline-block h-2 w-2 rounded-full shrink-0', isOk ? 'bg-success-foreground' : 'bg-warning-foreground')} />
                {message}
              </div>
            </div>
            {details && (
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
            )}
          </CardContent>
        </CollapsibleTrigger>
        {details && (
          <CollapsibleContent>
            <div className="px-4 pb-4 text-xs text-muted-foreground border-t border-border/50 pt-3 space-y-1">
              {details}
            </div>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
}
