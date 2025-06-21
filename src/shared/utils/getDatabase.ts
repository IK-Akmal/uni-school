import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

// Функция для получения экземпляра базы данных
export const getDatabase = async (
  dbName: string = "db.sqlite"
): Promise<Database> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await Database.load(`sqlite:${dbName}`);
    return dbInstance;
  } catch (error) {
    console.error("Failed to load database:", error);
    throw error;
  }
};
