'use client';

import { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout as GridLayout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Plus, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { 
  DashboardLayout, 
  DashboardWidget, 
  WidgetType,
  WidgetPosition 
} from '@/lib/types/dashboard';
import { GRID_COLS, GRID_BREAKPOINTS, GRID_ROW_HEIGHT, GRID_MARGIN } from '@/lib/types/dashboard';
import { WidgetFactory } from './WidgetFactory';
import { WidgetLibrary } from './WidgetLibrary';

// Add responsive wrapper
const ResponsiveGridLayout = WidthProvider(Responsive);

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface CustomizableDashboardProps {
  initialLayout?: DashboardLayout;
  userRole: string;
  onLayoutSave?: (layout: DashboardLayout) => void;
}

export function CustomizableDashboard({
  initialLayout,
  userRole,
  onLayoutSave,
}: CustomizableDashboardProps) {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    initialLayout?.widgets || []
  );
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Convert widgets to layout format for grid
  const layouts = useMemo(() => {
    const gridLayout = widgets.map((w) => w.position);
    return {
      lg: gridLayout,
      md: gridLayout,
      sm: gridLayout,
      xs: gridLayout,
    };
  }, [widgets]);

  // Handle layout change from drag/resize
  const handleLayoutChange = useCallback((layout: GridLayout[], layouts: any) => {
    if (!editMode) return;

    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = layout.find((l) => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            ...widget.position,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
  }, [editMode, widgets]);

  // Add new widget
  const handleAddWidget = useCallback((widgetType: WidgetType) => {
    const newWidget: DashboardWidget = {
      id: `${widgetType}_${Date.now()}`,
      type: widgetType,
      position: {
        i: `${widgetType}_${Date.now()}`,
        x: 0,
        y: Infinity, // Place at bottom
        w: 4,
        h: 2,
        minW: 2,
        minH: 2,
      },
      config: {
        refreshInterval: 60,
        displayOptions: {
          showHeader: true,
          showFooter: false,
        },
      },
      isVisible: true,
    };

    setWidgets([...widgets, newWidget]);
    setShowWidgetLibrary(false);
    toast({
      title: 'Widget added',
      description: 'Widget has been added to your dashboard',
    });
  }, [widgets, toast]);

  // Remove widget
  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
    toast({
      title: 'Widget removed',
      description: 'Widget has been removed from your dashboard',
    });
  }, [widgets, toast]);

  // Save layout
  const handleSaveLayout = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: initialLayout?.name || 'My Dashboard',
          isDefault: initialLayout?.isDefault || true,
          widgets,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Layout saved',
          description: 'Your dashboard layout has been saved',
        });
        setEditMode(false);
        if (onLayoutSave) {
          onLayoutSave(data.layout);
        }
      } else {
        throw new Error(data.error || 'Failed to save layout');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [widgets, initialLayout, toast, onLayoutSave]);

  // Reset to default layout
  const handleResetLayout = useCallback(async () => {
    if (!confirm('Reset to default layout? This will discard your current layout.')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/layout/default?role=${userRole}`);
      const data = await response.json();

      if (data.success && data.layout) {
        setWidgets(data.layout.widgets || []);
        toast({
          title: 'Layout reset',
          description: 'Dashboard has been reset to default layout',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset layout',
        variant: 'destructive',
      });
    }
  }, [userRole, toast]);

  const usedWidgetTypes = useMemo(
    () => new Set(widgets.map((w) => w.type)),
    [widgets]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {initialLayout?.name || 'My Dashboard'}
          </h2>
          {editMode && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Edit Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetLibrary(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLayout}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveLayout}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Layout
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={GRID_BREAKPOINTS}
        cols={GRID_COLS}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        isDraggable={editMode}
        isResizable={editMode}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            <WidgetFactory
              widget={widget}
              editMode={editMode}
              onRemove={() => handleRemoveWidget(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-lg font-medium mb-2">No widgets added</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Edit Layout" and then "Add Widget" to get started
          </p>
          <Button
            variant="default"
            onClick={() => {
              setEditMode(true);
              setShowWidgetLibrary(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Widget
          </Button>
        </div>
      )}

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={handleAddWidget}
          usedWidgets={usedWidgetTypes}
          onClose={() => setShowWidgetLibrary(false)}
        />
      )}
    </div>
  );
}

