import { createContext } from "react";

export const UNSAVED_CHANGES_WARNING =
  "你有未保存的修改，确定要离开吗？";

export interface GuardEntry {
  id: string;
  message: string;
}

export interface UnsavedChangesContextValue {
  registerGuard: (id: string, message: string | null) => void;
}

export const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);
