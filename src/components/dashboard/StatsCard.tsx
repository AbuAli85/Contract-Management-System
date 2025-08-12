import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
  trend,
}: StatsCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-lg', className)}>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <h2 className='text-3xl font-bold'>{value}</h2>
          </div>
          <div className='rounded-full bg-primary/10 p-3'>{icon}</div>
        </div>
        <div className='mt-4 flex items-center gap-2'>
          {trend && (
            <span
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
