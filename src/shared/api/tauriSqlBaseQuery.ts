import Database, { QueryResult } from "@tauri-apps/plugin-sql";
import { BaseQueryFn } from "@reduxjs/toolkit/query";

// Интерфейс для аргументов SQL запроса
export interface SqlQueryArgs<T = any> {
  sql: string;
  args?: unknown[];
  useTransaction?: boolean;
  isSelect?: boolean; // Явно указываем, что это SELECT-запрос
  resultType?: new () => T; // Опциональный тип для результата
}

// Типы результатов SQL запросов
export type SqlSelectResult<T = any> = T[];
export type SqlExecuteResult = QueryResult;

// Тип результата запроса
export type SqlQueryResult<T = any> = SqlSelectResult<T> | SqlExecuteResult;

// Кэш для экземпляра базы данных
let dbInstance: Database | null = null;

// Функция для получения экземпляра базы данных
const getDatabase = async (dbName: string = "db.sqlite"): Promise<Database> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await Database.load(`sqlite:${dbName}`);
    return dbInstance;
  } catch (error) {
    console.error("Failed to load database:", error);
    throw error;
  }
};

// Создаем baseQuery, который использует переданный экземпляр базы данных
export const createTauriSqlBaseQuery = (
  dbName: string
): BaseQueryFn<SqlQueryArgs<any>, SqlQueryResult<any>, unknown> => {
  return async <T>({
    sql,
    args = [],
    useTransaction = false,
    isSelect,
  }: SqlQueryArgs<T>) => {
    try {
      // Инициализируем базу данных, если она еще не инициализирована
      const db = await getDatabase(dbName);

      if (useTransaction) {
        await db.execute("BEGIN TRANSACTION", []);
        try {
          let result;
          // Используем явно указанный тип запроса или определяем по началу запроса
          if (
            isSelect === true ||
            (isSelect !== false &&
              sql.trim().toUpperCase().startsWith("SELECT"))
          ) {
            result = await db.select<T>(sql, args);
          } else {
            result = await db.execute(sql, args);
          }
          await db.execute("COMMIT", []);
          return { data: result };
        } catch (error) {
          await db.execute("ROLLBACK", []);
          throw error;
        }
      } else {
        // Используем явно указанный тип запроса или определяем по началу запроса
        if (
          isSelect === true ||
          (isSelect !== false && sql.trim().toUpperCase().startsWith("SELECT"))
        ) {
          const data = await db.select<T>(sql, args);
          return { data };
        } else {
          const result = await db.execute(sql, args);
          return { data: result };
        }
      }
    } catch (error) {
      return { error };
    }
  };
};
