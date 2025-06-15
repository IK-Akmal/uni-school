import { useEffect, type PropsWithChildren, useState } from "react";
import Database from "@tauri-apps/plugin-sql";

import { DbContext, DbContextType } from "../../context/db";

interface DBProviderProps extends PropsWithChildren {
  dbName?: string;
}

export const DBProvider = ({
  children,
  dbName = "mydatabase.db",
}: DBProviderProps) => {
  const [dbState, setDbState] = useState<DbContextType>({
    db: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const connection = async () => {
      try {
        const dbInstance = await Database.load(`sqlite:${dbName}`);
        setDbState({
          db: dbInstance,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Database connection error:", error);
        setDbState({
          db: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    connection();
  }, [dbName]);

  return <DbContext.Provider value={dbState}>{children}</DbContext.Provider>;
};
