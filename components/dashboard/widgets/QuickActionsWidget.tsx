'use client';
import { useParams } from 'next/navigation';

import { BaseWidget } from '../BaseWidget';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  Users,
  Building,
  Search,
  BarChart,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import type { WidgetProps } from '@/lib/types/dashboard';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'create_contract',
    label: 'New Contract',
    icon: <Plus className='h-4 w-4' />,
    href: `/${locale}/contracts/create`,
    description: 'Create a new contract',
    color: 'primary',
  },
  {
    id: 'add_promoter',
    label: 'Add Promoter',
    icon: <Users className='h-4 w-4' />,
    href: `/${locale}/promoters/create`,
    description: 'Register new promoter',
    color: 'default',
  },
  {
    id: 'add_party',
    label: 'Add Party',
    icon: <Building className='h-4 w-4' />,
    href: `/${locale}/parties/create`,
    description: 'Create new party',
    color: 'default',
  },
  {
    id: 'search_contracts',
    label: 'Search',
    icon: <Search className='h-4 w-4' />,
    href: `/${locale}/contracts`,
    description: 'Search contracts',
    color: 'default',
  },
  {
    id: 'view_reports',
    label: 'Reports',
    icon: <BarChart className='h-4 w-4' />,
    href: `/${locale}/reports`,
    description: 'View analytics',
    color: 'default',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className='h-4 w-4' />,
    href: `/${locale}/settings`,
    description: 'System settings',
    color: 'default',
  },
];

export function QuickActionsWidget(props: WidgetProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const actions = props.config.customSettings?.actions || DEFAULT_ACTIONS;
  const layout = props.config.displayOptions?.theme || 'grid'; // 'grid' or 'list'

  const getButtonVariant = (color: string) => {
    switch (color) {
      case 'primary':
        return 'default';
      case 'secondary':
        return 'secondary';
      case 'success':
        return 'default';
      case 'warning':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <BaseWidget
      {...props}
      title='Quick Actions'
      description='Common tasks and shortcuts'
      icon={<FileText className='h-4 w-4' />}
    >
      {layout === 'grid' ? (
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {actions.map((action: QuickAction) => (
            <Link key={action.id} href={action.href}>
              <Button
                variant={getButtonVariant(action.color)}
                className='w-full h-auto py-4 flex-col gap-2'
              >
                {action.icon}
                <span className='text-xs font-medium'>{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      ) : (
        <div className='space-y-2'>
          {actions.map((action: QuickAction) => (
            <Link key={action.id} href={action.href}>
              <Button
                variant='outline'
                className='w-full justify-start gap-3 h-auto py-3'
              >
                {action.icon}
                <div className='flex-1 text-left'>
                  <div className='font-medium'>{action.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}
