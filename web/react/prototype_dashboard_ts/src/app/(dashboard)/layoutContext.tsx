'use client';

/**
 * @file app/(dashboard)/layoutContext.tsx
 * @description 대시보드 레이아웃 상태 Context
 *
 * layout.tsx → children (home/page.tsx, MobileHeader 등) 에게
 * sidebarOpen + widgetVisibility 상태를 전달하기 위한 Context.
 */

import { createContext, useContext } from 'react';
import type { WidgetVisibility } from '@/components/dashboard/WidgetSelector';
import { DEFAULT_WIDGET_VISIBILITY } from '@/components/dashboard/WidgetSelector';

interface LayoutContextValue {
  sidebarOpen:        boolean;
  widgetVisibility:   WidgetVisibility;
  setWidgetVisibility: (v: WidgetVisibility) => void;
}

export const LayoutContext = createContext<LayoutContextValue>({
  sidebarOpen:         true,
  widgetVisibility:    DEFAULT_WIDGET_VISIBILITY,
  setWidgetVisibility: () => {},
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}
