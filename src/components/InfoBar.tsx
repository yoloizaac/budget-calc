import { Info } from 'lucide-react';

interface InfoBarProps {
  children?: React.ReactNode;
  message?: string;
}

export function InfoBar({ children, message }: InfoBarProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-secondary" />
      <span>{children || message}</span>
    </div>
  );
}
