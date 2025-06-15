import { createContext, useContext } from "react";
import type Database from "@tauri-apps/plugin-sql";

export interface DbContextType {
  db: Database | null;
  isLoading: boolean;
  error: Error | null;
}

export const DbContext = createContext<DbContextType>({
  db: null,
  isLoading: true,
  error: null,
});

// Хук для удобного доступа к контексту базы данных
export const useDb = () => useContext(DbContext);
