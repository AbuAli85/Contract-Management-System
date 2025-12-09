/**
 * Dashboard Layout Types
 * Types for customizable dashboard system
 */

import type { Layout as GridLayout } from 'react-grid-layout';

// ==================== Widget Types ====================

export type WidgetType =
  | 'contract_metrics'
  | 'promoter_metrics'
  | 'compliance_rate'
  | 'recent_activity'
  | 'upcoming_expiries'
  | 'revenue_chart'
  | 'quick_actions'
  | 'party_metrics'
  | 'performance_chart'
  | 'task_list';

export interface WidgetDefinition {
  id: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'metrics' | 'charts' | 'lists' | 'actions';
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  requiresPermission?: string;
  configurable: boolean;
}

export interface WidgetConfig {
  refreshInterval?: number; // seconds
  filters?: Record<string, any>;
  displayOptions?: {
    showHeader?: boolean;
    showFooter?: boolean;
    theme?: 'default' | 'compact' | 'detailed';
    chartType?: 'line' | 'bar' | 'pie' | 'area';
  };
  dataSource?: string;
  customSettings?: Record<string, any>;
}

export interface WidgetPosition extends GridLayout {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: WidgetConfig;
  isVisible: boolean;
}

// ==================== Layout Types ====================

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  isShared: boolean;
  widgets: DashboardWidget[];
  breakpoint: 'lg' | 'md' | 'sm' | 'xs';
  createdAt: string;
  updatedAt: string;
}

export interface DefaultLayoutByRole {
  id: string;
  role: string;
  layoutData: WidgetPosition[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedLayoutAccess {
  id: string;
  layoutId: string;
  sharedWithUserId?: string;
  sharedWithRole?: string;
  canEdit: boolean;
  createdAt: string;
}

// ==================== API Types ====================

export interface SaveLayoutRequest {
  name: string;
  isDefault?: boolean;
  isShared?: boolean;
  widgets: DashboardWidget[];
  breakpoint?: string;
}

export interface SaveLayoutResponse {
  success: boolean;
  layout: DashboardLayout;
  message?: string;
}

export interface GetLayoutResponse {
  success: boolean;
  layout: DashboardLayout | null;
  message?: string;
}

export interface ListLayoutsResponse {
  success: boolean;
  layouts: DashboardLayout[];
  message?: string;
}

export interface ShareLayoutRequest {
  layoutId: string;
  shareWithUserId?: string;
  shareWithRole?: string;
  canEdit: boolean;
}

export interface CloneLayoutRequest {
  sourceLayoutId: string;
  newName?: string;
}

// ==================== Component Props ====================

export interface DashboardLayoutProps {
  initialLayout?: DashboardLayout;
  userRole: string;
  onLayoutChange?: (widgets: DashboardWidget[]) => void;
  onSaveLayout?: (layout: DashboardLayout) => void;
  editMode?: boolean;
}

export interface WidgetProps {
  id: string;
  config: WidgetConfig;
  onConfigChange?: ((config: WidgetConfig) => void) | undefined;
  onRemove?: (() => void) | undefined;
  editMode?: boolean;
}

export interface WidgetLibraryProps {
  availableWidgets: WidgetDefinition[];
  onAddWidget: (widgetType: WidgetType) => void;
  usedWidgets: Set<string>;
}

export interface WidgetConfigPanelProps {
  widget: DashboardWidget;
  definition: WidgetDefinition;
  onSave: (config: WidgetConfig) => void;
  onCancel: () => void;
}

// ==================== Utility Types ====================

export interface GridBreakpoint {
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

export interface ResponsiveLayout {
  lg: WidgetPosition[];
  md: WidgetPosition[];
  sm: WidgetPosition[];
  xs: WidgetPosition[];
}

// ==================== Constants ====================

export const GRID_COLS: GridBreakpoint = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

export const GRID_BREAKPOINTS: GridBreakpoint = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

export const GRID_ROW_HEIGHT = 60;
export const GRID_MARGIN: [number, number] = [16, 16];
export const GRID_CONTAINER_PADDING: [number, number] = [16, 16];

// ==================== Widget Definitions ====================

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  contract_metrics: {
    id: 'contract_metrics',
    name: 'Contract Metrics',
    description: 'Overview of contract counts and statuses',
    icon: 'FileText',
    category: 'metrics',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 2 },
    configurable: true,
  },
  promoter_metrics: {
    id: 'promoter_metrics',
    name: 'Promoter Metrics',
    description: 'Promoter statistics and insights',
    icon: 'Users',
    category: 'metrics',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 2 },
    configurable: true,
  },
  compliance_rate: {
    id: 'compliance_rate',
    name: 'Compliance Rate',
    description: 'Contract compliance and expiry tracking',
    icon: 'Shield',
    category: 'metrics',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 2 },
    configurable: false,
  },
  recent_activity: {
    id: 'recent_activity',
    name: 'Recent Activity',
    description: 'Latest changes and updates',
    icon: 'Activity',
    category: 'lists',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 3, h: 2 },
    configurable: true,
  },
  upcoming_expiries: {
    id: 'upcoming_expiries',
    name: 'Upcoming Expiries',
    description: 'Contracts expiring soon',
    icon: 'Clock',
    category: 'lists',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 3, h: 2 },
    configurable: true,
  },
  revenue_chart: {
    id: 'revenue_chart',
    name: 'Revenue Chart',
    description: 'Revenue trends and analytics',
    icon: 'TrendingUp',
    category: 'charts',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 3, h: 2 },
    requiresPermission: 'analytics:read',
    configurable: true,
  },
  quick_actions: {
    id: 'quick_actions',
    name: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    icon: 'Zap',
    category: 'actions',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 3, h: 2 },
    configurable: false,
  },
  party_metrics: {
    id: 'party_metrics',
    name: 'Party Metrics',
    description: 'Party statistics and information',
    icon: 'Building',
    category: 'metrics',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 2, h: 2 },
    configurable: true,
  },
  performance_chart: {
    id: 'performance_chart',
    name: 'Performance Chart',
    description: 'System performance metrics',
    icon: 'BarChart',
    category: 'charts',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 3, h: 2 },
    requiresPermission: 'analytics:read',
    configurable: true,
  },
  task_list: {
    id: 'task_list',
    name: 'Task List',
    description: 'Pending tasks and reminders',
    icon: 'CheckSquare',
    category: 'lists',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 3, h: 2 },
    configurable: true,
  },
};
