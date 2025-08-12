import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className='text-center'>
        <Loader2
          className={cn('mx-auto mb-2 animate-spin', sizeClasses[size])}
        />
        {text && <p className='text-sm text-muted-foreground'>{text}</p>}
      </div>
    </div>
  );
}
