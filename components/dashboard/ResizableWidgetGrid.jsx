'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import Card from '@/components/cards/Card';
import 'react-grid-layout/css/styles.css';

// Import all widget components
import { PriceTracker } from '@/components/widgets';

// Widget type mapping
const WIDGET_COMPONENTS = {
  'price-tracker': PriceTracker,
};

/**
 * ResizableWidgetGrid - Simple draggable and resizable grid
 * Responsive to parent container width using custom hook
 */
const ResizableWidgetGrid = ({ widgets = [], onWidgetsChange }) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Measure container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Convert widgets to react-grid-layout format
  const layout = useMemo(() => {
    return widgets.map((widget, index) => ({
      i: widget.id,
      x: widget.x ?? (index % 4) * 3,
      y: widget.y ?? Math.floor(index / 4) * 2,
      w: widget.w ?? 3,
      h: widget.h ?? 2,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 6,
      static: widget.isFixed ?? false, // Add static property for fixed cards
    }));
  }, [widgets]);

  const handleLayoutChange = (newLayout) => {
    // Update widgets with new layout positions and sizes
    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = newLayout.find((l) => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return widget;
    });

    onWidgetsChange?.(updatedWidgets);
  };

  // Handle widget settings changes
  const handleToggleTitle = (widgetId) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId
        ? { ...widget, showTitle: !widget.showTitle }
        : widget
    );
    onWidgetsChange?.(updatedWidgets);
  };

  const handleToggleSubtitle = (widgetId) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId
        ? { ...widget, showSubtitle: !widget.showSubtitle }
        : widget
    );
    onWidgetsChange?.(updatedWidgets);
  };

  const handleToggleFixed = (widgetId) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId
        ? { ...widget, isFixed: !widget.isFixed }
        : widget
    );
    onWidgetsChange?.(updatedWidgets);
  };

  const handleDeleteWidget = (widgetId) => {
    const updatedWidgets = widgets.filter((widget) => widget.id !== widgetId);
    onWidgetsChange?.(updatedWidgets);
  };

  const handleChangeVariant = (widgetId, newVariant) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId
        ? { ...widget, variant: newVariant }
        : widget
    );
    onWidgetsChange?.(updatedWidgets);
  };

  return (
    <div ref={containerRef} className="w-full">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={80}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        resizeHandles={['se', 'sw', 'ne', 'nw']}
      >
        {widgets.map((widget) => {
          // Get the widget component for this widget type
          const WidgetComponent = WIDGET_COMPONENTS[widget.type];
          
          return (
            <div key={widget.id}>
              {WidgetComponent ? (
                <WidgetComponent
                  config={{
                    ...widget,
                    showTitle: widget.showTitle !== false,
                    showSubtitle: widget.showSubtitle !== false,
                    variant: widget.variant,
                    isFixed: widget.isFixed || false,
                    tokenId: widget.tokenId,
                  }}
                  onUpdateConfig={(newConfig) => {
                    const updatedWidgets = widgets.map((w) =>
                      w.id === widget.id ? { ...w, ...newConfig } : w
                    );
                    onWidgetsChange?.(updatedWidgets);
                  }}
                  onDelete={() => handleDeleteWidget(widget.id)}
                />
              ) : (
                // Fallback for unknown widget types
                <Card
                  title={widget.title}
                  description={widget.description}
                  variant={widget.variant}
                  className="h-full"
                  draggable={true}
                  showTitle={widget.showTitle !== false}
                  showSubtitle={widget.showSubtitle !== false}
                  isFixed={widget.isFixed || false}
                  onToggleTitle={() => handleToggleTitle(widget.id)}
                  onToggleSubtitle={() => handleToggleSubtitle(widget.id)}
                  onToggleFixed={() => handleToggleFixed(widget.id)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  onChangeVariant={(newVariant) => handleChangeVariant(widget.id, newVariant)}
                >
                  <div className="flex items-center justify-center h-full text-4xl">
                    {widget.icon || '❓'}
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </GridLayout>

      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .react-grid-item.resizing {
          transition: none;
          z-index: 100;
        }

        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 100;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 24px;
          border: 2px dashed rgba(59, 130, 246, 0.5);
        }

        /* Resize handles */
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(255, 255, 255, 0.4);
          border-bottom: 2px solid rgba(255, 255, 255, 0.4);
        }

        .react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          cursor: sw-resize;
          transform: rotate(90deg);
        }

        .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }

        .react-resizable-handle-nw {
          top: 0;
          left: 0;
          cursor: nw-resize;
          transform: rotate(180deg);
        }

        .react-resizable-handle-ne {
          top: 0;
          right: 0;
          cursor: ne-resize;
          transform: rotate(270deg);
        }

        .react-resizable-handle:hover::after {
          border-right-color: rgba(255, 255, 255, 0.8);
          border-bottom-color: rgba(255, 255, 255, 0.8);
        }

        .drag-handle {
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default ResizableWidgetGrid;
