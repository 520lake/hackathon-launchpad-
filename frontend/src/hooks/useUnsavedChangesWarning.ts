import { useEffect, useId } from "react";
import {
  UnsavedChangesContext,
  UNSAVED_CHANGES_WARNING,
} from "@/contexts/unsavedChangesShared";
import { useContext } from "react";

export { UNSAVED_CHANGES_WARNING };

export function useUnsavedChangesWarning(
  enabled: boolean,
  message = UNSAVED_CHANGES_WARNING,
) {
  const context = useContext(UnsavedChangesContext);
  const registerGuard = context?.registerGuard;
  const id = useId();

  useEffect(() => {
    if (!registerGuard) {
      return;
    }

    registerGuard(id, enabled ? message : null);

    return () => {
      registerGuard(id, null);
    };
  }, [registerGuard, enabled, id, message]);
}
