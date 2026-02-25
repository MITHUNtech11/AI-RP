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
    <div className="sticky top-0 z-10 bg-[var(--color-card)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft size={24} />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-[var(--color-card-foreground)]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}
