import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type DrawerStrategy = 'close' | 'hide' | 'stack';

export interface DrawerState {
  id: string;
  visible: boolean;
  hidden: boolean;
  zIndex: number;
  strategy: DrawerStrategy;
}

interface DrawerContextValue {
  drawers: Map<string, DrawerState>;
  openDrawer: (id: string, strategy?: DrawerStrategy) => void;
  closeDrawer: (id: string) => void;
  isDrawerOpen: (id: string) => boolean;
  getDrawerState: (id: string) => DrawerState | undefined;
  getTopDrawer: () => DrawerState | undefined;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

interface DrawerProviderProps {
  children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [drawers, setDrawers] = useState<Map<string, DrawerState>>(new Map());

  const openDrawer = useCallback((id: string, strategy: DrawerStrategy = 'hide') => {
    setDrawers(prev => {
      const newDrawers = new Map(prev);
      const currentTopDrawer = Array.from(newDrawers.values())
        .filter(d => d.visible && !d.hidden)
        .sort((a, b) => b.zIndex - a.zIndex)[0];

      if (currentTopDrawer && currentTopDrawer.id !== id) {
        switch (strategy) {
          case 'close':
            newDrawers.set(currentTopDrawer.id, {
              ...currentTopDrawer,
              visible: false,
              hidden: false,
            });
            break;
          case 'hide':
            newDrawers.set(currentTopDrawer.id, {
              ...currentTopDrawer,
              visible: true,
              hidden: true,
            });
            break;
          case 'stack':
            break;
        }
      }

      const maxZIndex = Math.max(0, ...Array.from(newDrawers.values()).map(d => d.zIndex));
      
      newDrawers.set(id, {
        id,
        visible: true,
        hidden: false,
        zIndex: maxZIndex + 1,
        strategy,
      });

      return newDrawers;
    });
  }, []);

  const closeDrawer = useCallback((id: string) => {
    setDrawers(prev => {
      const newDrawers = new Map(prev);
      const closingDrawer = newDrawers.get(id);
      
      if (!closingDrawer) return prev;

      newDrawers.set(id, {
        ...closingDrawer,
        visible: false,
        hidden: false,
      });

      const hiddenDrawers = Array.from(newDrawers.values())
        .filter(d => d.hidden && d.id !== id)
        .sort((a, b) => b.zIndex - a.zIndex);

      if (hiddenDrawers.length > 0) {
        const topHiddenDrawer = hiddenDrawers[0];
        newDrawers.set(topHiddenDrawer.id, {
          ...topHiddenDrawer,
          visible: true,
          hidden: false,
        });
      }

      return newDrawers;
    });
  }, []);

  const isDrawerOpen = useCallback((id: string) => {
    const drawer = drawers.get(id);
    return drawer ? drawer.visible && !drawer.hidden : false;
  }, [drawers]);

  const getDrawerState = useCallback((id: string) => {
    return drawers.get(id);
  }, [drawers]);

  const getTopDrawer = useCallback(() => {
    return Array.from(drawers.values())
      .filter(d => d.visible && !d.hidden)
      .sort((a, b) => b.zIndex - a.zIndex)[0];
  }, [drawers]);

  return (
    <DrawerContext.Provider value={{
      drawers,
      openDrawer,
      closeDrawer,
      isDrawerOpen,
      getDrawerState,
      getTopDrawer,
    }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
}
