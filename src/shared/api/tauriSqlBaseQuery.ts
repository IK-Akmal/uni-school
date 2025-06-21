import { BaseQueryFn } from "@reduxjs/toolkit/query";
import Database from "@tauri-apps/plugin-sql";
import { getDatabase } from "@/shared/utils/getDatabase";

// Типы для SQL операций
export enum SqlOperationType {
  SELECT = "SELECT",
  INSERT = "INSERT",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  CREATE = "CREATE",
  DROP = "DROP",
  ALTER = "ALTER",
}

// Интерфейсы для типизации
export interface SqlSelectResult<T> {
  data: T[];
}

export interface SqlExecuteResult {
  rowsAffected: number;
  lastInsertId?: number;
  lastInsertRowid?: number;
}

export type SqlQueryResult<T> = T[] | SqlExecuteResult;

export interface SqlQueryArgs {
  sql: string;
  args?: any[];
  operationType?: SqlOperationType;
  useTransaction?: boolean;
}

export interface DatabaseError {
  message: string;
  details?: any;
}

// Класс для управления подключением к базе данных
export class DatabaseManager {
  private static instance: DatabaseManager;
  private database: Database | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getDatabase(dbName: string = "db.sqlite"): Promise<Database> {
    if (!this.database) {
      this.database = await getDatabase(dbName);
    }
    return this.database;
  }

  async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }
}

// Утилита для определения типа SQL операции
const detectOperationType = (sql: string): SqlOperationType => {
  const trimmedSql = sql.trim().toUpperCase();

  if (trimmedSql.startsWith("SELECT")) return SqlOperationType.SELECT;
  if (trimmedSql.startsWith("INSERT")) return SqlOperationType.INSERT;
  if (trimmedSql.startsWith("UPDATE")) return SqlOperationType.UPDATE;
  if (trimmedSql.startsWith("DELETE")) return SqlOperationType.DELETE;
  if (trimmedSql.startsWith("CREATE")) return SqlOperationType.CREATE;
  if (trimmedSql.startsWith("DROP")) return SqlOperationType.DROP;
  if (trimmedSql.startsWith("ALTER")) return SqlOperationType.ALTER;

  // По умолчанию считаем SELECT
  return SqlOperationType.SELECT;
};

// Утилита для проверки, является ли операция SELECT
const isSelectOperation = (operationType: SqlOperationType): boolean => {
  return operationType === SqlOperationType.SELECT;
};

// Основная функция для выполнения SQL запросов
const executeSqlQuery = async <T>(
  db: Database,
  { sql, args = [], operationType }: SqlQueryArgs
): Promise<SqlQueryResult<T>> => {
  const detectedType = operationType || detectOperationType(sql);

  try {
    if (isSelectOperation(detectedType)) {
      const result = await db.select<T>(sql, args);
      return result as T[]; // Возвращаем массив для SELECT операций
    } else {
      return (await db.execute(sql, args)) as SqlExecuteResult;
    }
  } catch (error) {
    const dbError: DatabaseError = {
      message: `SQL execution failed: ${detectedType}`,
      details: error,
    };
    console.error("SQL execution error:", dbError);
    throw dbError;
  }
};

// Функция для выполнения запросов в транзакции
const executeInTransaction = async <T>(
  db: Database,
  queryArgs: SqlQueryArgs
): Promise<SqlQueryResult<T>> => {
  try {
    // Tauri SQL plugin автоматически управляет транзакциями
    // Просто выполняем запрос без явного BEGIN/COMMIT
    const result = await executeSqlQuery<T>(db, queryArgs);
    console.log("Query executed successfully in transaction context");
    
    return result;
  } catch (error) {
    console.error("Query failed in transaction context:", error);
    throw error;
  }
};

// Создаем baseQuery, который использует переданный экземпляр базы данных
export const createTauriSqlBaseQuery = (
  dbName: string = "db.sqlite"
): BaseQueryFn<SqlQueryArgs, SqlQueryResult<any>, DatabaseError> => {
  const dbManager = DatabaseManager.getInstance();

  return async (queryArgs: SqlQueryArgs) => {
    try {
      const db = await dbManager.getDatabase(dbName);

      let result: SqlQueryResult<any>;

      if (queryArgs.useTransaction) {
        result = await executeInTransaction(db, queryArgs);
      } else {
        result = await executeSqlQuery(db, queryArgs);
      }

      return { data: result };
    } catch (error) {
      const dbError: DatabaseError =
        error instanceof Error
          ? { message: error.message, details: error }
          : { message: "Unknown database error", details: error };

      console.error("Database query failed:", dbError);
      return { error: dbError };
    }
  };
};

// Экспорт утилит для использования в других модулях
export { detectOperationType, isSelectOperation };
