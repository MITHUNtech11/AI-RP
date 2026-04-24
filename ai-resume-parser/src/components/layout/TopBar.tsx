import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, actions }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-lg border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto w-full">
        <div className="flex items-center gap-1">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2 hover:bg-[var(--color-secondary)] rounded-full">
              <ArrowLeft size={20} className="text-[var(--color-foreground)]" />
            </Button>
          )}
          <h1 className="text-base font-semibold text-[var(--color-foreground)] tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}
