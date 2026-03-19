import { useEffect, useId } from "react";
import {
  UnsavedChangesContext,
  UNSAVED_CHANGES_WARNING,
} from "@/contexts/unsavedChangesContext";
import { useContext } from "react";

export { UNSAVED_CHANGES_WARNING };

export function useUnsavedChangesWarning(
  enabled: boolean,
  message = UNSAVED_CHANGES_WARNING,
) {
  const context = useContext(UnsavedChangesContext);
  const id = useId();

  useEffect(() => {
    if (!context) {
      return;
    }

    context.registerGuard(id, enabled ? message : null);

    return () => {
      context.registerGuard(id, null);
    };
  }, [context, enabled, id, message]);
}
