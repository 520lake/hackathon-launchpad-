import { useCallback, useContext, useMemo, useState } from "react";
import {
  UNSAFE_NavigationContext as NavigationContext,
  useBeforeUnload,
} from "react-router-dom";
import type { ReactNode } from "react";
import {
  UnsavedChangesContext,
  type GuardEntry,
} from "./unsavedChangesContext";

interface NavigatorLike {
  push: (...args: unknown[]) => void;
  replace: (...args: unknown[]) => void;
  go?: (...args: unknown[]) => void;
}

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
      const next = current.filter((entry) => entry.id !== id);
      if (message) {
        next.push({ id, message });
      }
      return next;
    });
  }, []);

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

    const navigator = navigationContext.navigator as NavigatorLike;
    const confirmNavigation = () =>
      !activeGuard || window.confirm(activeGuard.message);

    return {
      ...navigationContext,
      navigator: {
        ...navigator,
        push: (...args: unknown[]) => {
          if (confirmNavigation()) {
            navigator.push(...args);
          }
        },
        replace: (...args: unknown[]) => {
          if (confirmNavigation()) {
            navigator.replace(...args);
          }
        },
        go:
          navigator.go == null
            ? undefined
            : (...args: unknown[]) => {
                if (confirmNavigation()) {
                  navigator.go?.(...args);
                }
              },
      },
    };
  }, [activeGuard, navigationContext]);

  return (
    <UnsavedChangesContext.Provider value={{ registerGuard }}>
      <NavigationContext.Provider value={guardedNavigationContext}>
        {children}
      </NavigationContext.Provider>
    </UnsavedChangesContext.Provider>
  );
}
