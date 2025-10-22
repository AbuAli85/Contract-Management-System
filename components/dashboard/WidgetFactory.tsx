'use client';

import type { DashboardWidget, WidgetProps } from '@/lib/types/dashboard';
import {
  ContractMetricsWidget,
  PromoterMetricsWidget,
  ComplianceRateWidget,
  RecentActivityWidget,
  UpcomingExpiriesWidget,
  RevenueChartWidget,
  QuickActionsWidget,
} from './widgets';

interface WidgetFactoryProps {
  widget: DashboardWidget;
  editMode?: boolean;
  onRemove?: () => void;
  onConfigChange?: (config: any) => void;
}

export function WidgetFactory({
  widget,
  editMode = false,
  onRemove,
  onConfigChange,
}: WidgetFactoryProps) {
  const widgetProps: WidgetProps = {
    id: widget.id,
    config: widget.config,
    editMode,
    ...(onRemove && { onRemove }),
    ...(onConfigChange && { onConfigChange }),
  };

  switch (widget.type) {
    case 'contract_metrics':
      return <ContractMetricsWidget {...widgetProps} />;
    case 'promoter_metrics':
      return <PromoterMetricsWidget {...widgetProps} />;
    case 'compliance_rate':
      return <ComplianceRateWidget {...widgetProps} />;
    case 'recent_activity':
      return <RecentActivityWidget {...widgetProps} />;
    case 'upcoming_expiries':
      return <UpcomingExpiriesWidget {...widgetProps} />;
    case 'revenue_chart':
      return <RevenueChartWidget {...widgetProps} />;
    case 'quick_actions':
      return <QuickActionsWidget {...widgetProps} />;
    default:
      return (
        <div className="p-4 border rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            Unknown widget type: {widget.type}
          </p>
        </div>
      );
  }
}

