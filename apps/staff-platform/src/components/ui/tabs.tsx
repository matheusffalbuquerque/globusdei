'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used inside <Tabs>.');
  }
  return context;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn('space-y-6', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex min-h-11 w-full flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/40 p-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: currentValue, setValue } = useTabsContext();
  const isActive = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { value: currentValue } = useTabsContext();

  if (currentValue !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
