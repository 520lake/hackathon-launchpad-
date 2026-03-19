import { useCallback, useContext, useMemo, useState } from "react";
import {
  UNSAFE_NavigationContext as NavigationContext,
  useBeforeUnload,
} from "react-router-dom";
import type { ReactNode } from "react";
import type { NavigateOptions, To } from "react-router-dom";
import {
  UnsavedChangesContext,
  type GuardEntry,
} from "./unsavedChangesShared";

export function UnsavedChangesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigationContext = useContext(NavigationContext);
  const [guards, setGuards] = useState<GuardEntry[]>([]);
  const activeGuard = guards[guards.length - 1] ?? null;

  const registerGuard = useCallback((id: string, message: string | null) => {
    setGuards((current) => {
      const previousEntry = current.find((entry) => entry.id === id) ?? null;
      if (
        (message == null && previousEntry == null) ||
        previousEntry?.message === message
      ) {
        return current;
      }

      const next = current.filter((entry) => entry.id !== id);
      if (message) {
        next.push({ id, message });
      }
      return next;
    });
  }, []);
  const contextValue = useMemo(
    () => ({ registerGuard }),
    [registerGuard],
  );

  useBeforeUnload((event) => {
    if (!activeGuard) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  const guardedNavigationContext = useMemo(() => {
    if (!navigationContext) {
      return navigationContext;
    }

    const navigator = navigationContext.navigator;
    const confirmNavigation = () =>
      !activeGuard || window.confirm(activeGuard.message);

    return {
      ...navigationContext,
      navigator: {
        ...navigator,
        push: (to: To, state?: unknown, opts?: NavigateOptions) => {
          if (confirmNavigation()) {
            navigator.push(to, state, opts);
          }
        },
        replace: (to: To, state?: unknown, opts?: NavigateOptions) => {
          if (confirmNavigation()) {
            navigator.replace(to, state, opts);
          }
        },
        go: (delta: number) => {
          if (confirmNavigation()) {
            navigator.go(delta);
          }
        },
      },
    };
  }, [activeGuard, navigationContext]);

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      <NavigationContext.Provider value={guardedNavigationContext}>
        {children}
      </NavigationContext.Provider>
    </UnsavedChangesContext.Provider>
  );
}
