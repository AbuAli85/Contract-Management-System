'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Users,
  Shield,
  Activity,
  Clock,
  TrendingUp,
  Zap,
  Building,
  BarChart,
  CheckSquare,
  Search,
} from 'lucide-react';
import type { WidgetType } from '@/lib/types/dashboard';
import { WIDGET_DEFINITIONS } from '@/lib/types/dashboard';

interface WidgetLibraryProps {
  onAddWidget: (widgetType: WidgetType) => void;
  usedWidgets: Set<WidgetType>;
  onClose: () => void;
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  contract_metrics: <FileText className='h-6 w-6' />,
  promoter_metrics: <Users className='h-6 w-6' />,
  compliance_rate: <Shield className='h-6 w-6' />,
  recent_activity: <Activity className='h-6 w-6' />,
  upcoming_expiries: <Clock className='h-6 w-6' />,
  revenue_chart: <TrendingUp className='h-6 w-6' />,
  quick_actions: <Zap className='h-6 w-6' />,
  party_metrics: <Building className='h-6 w-6' />,
  performance_chart: <BarChart className='h-6 w-6' />,
  task_list: <CheckSquare className='h-6 w-6' />,
};

export function WidgetLibrary({
  onAddWidget,
  usedWidgets,
  onClose,
}: WidgetLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const widgets = useMemo(() => {
    return Object.values(WIDGET_DEFINITIONS).filter(widget => {
      const matchesSearch =
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(
      Object.values(WIDGET_DEFINITIONS).map(w => w.category)
    );
    return Array.from(cats);
  }, []);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Widget Library</DialogTitle>
          <DialogDescription>
            Choose widgets to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 flex-1 overflow-hidden flex flex-col'>
          {/* Search and Filter */}
          <div className='space-y-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search widgets...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            <div className='flex gap-2'>
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Widget Grid */}
          <div className='flex-1 overflow-y-auto'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {widgets.map(widget => {
                const isUsed = usedWidgets.has(widget.id);

                return (
                  <div
                    key={widget.id}
                    className={`p-4 border rounded-lg ${
                      isUsed
                        ? 'bg-muted opacity-60'
                        : 'bg-card hover:shadow-md transition-shadow'
                    }`}
                  >
                    <div className='flex items-start gap-3 mb-3'>
                      <div className='flex-shrink-0 p-2 bg-primary/10 rounded-lg text-primary'>
                        {WIDGET_ICONS[widget.id]}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-medium mb-1'>{widget.name}</h3>
                        <p className='text-xs text-muted-foreground line-clamp-2'>
                          {widget.description}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {widget.category}
                        </Badge>
                        {widget.configurable && (
                          <Badge variant='secondary' className='text-xs'>
                            Configurable
                          </Badge>
                        )}
                      </div>

                      <Button
                        size='sm'
                        onClick={() => onAddWidget(widget.id)}
                        disabled={isUsed}
                      >
                        {isUsed ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {widgets.length === 0 && (
              <div className='flex flex-col items-center justify-center h-32 text-center'>
                <p className='text-muted-foreground'>No widgets found</p>
                <p className='text-sm text-muted-foreground mt-1'>
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
