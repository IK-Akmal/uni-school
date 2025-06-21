import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery } from "./tauriSqlBaseQuery";
import dayjs from "dayjs";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

// Типы для статистики
export interface MonthlyStudentStats {
  month: string;
  count: number;
}

export interface MonthlyGroupStats {
  month: string;
  count: number;
}

export interface MonthlyPaymentStats {
  month: string;
  count: number;
  totalAmount: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  totalPayments: number;
  totalPaymentAmount: number;
  studentsThisMonth: number;
  groupsThisMonth: number;
  paymentsThisMonth: number;
  paymentAmountThisMonth: number;
  overduePaymentsCount: number;
}

export interface OverduePaymentStudent {
  id: number;
  fullname: string;
  payment_due: number;
  phone_number: string;
  days_overdue: number;
}

export const statisticsApi = createApi({
  reducerPath: "statisticsApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Statistics"],
  endpoints: (builder) => ({
    // Получение статистики по студентам за последние 6 месяцев
    getMonthlyStudentStats: builder.query<MonthlyStudentStats[], void>({
      query: () => ({
        sql: `
          SELECT 
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as count
          FROM student
          WHERE created_at >= date('now', '-6 months')
          GROUP BY month
          ORDER BY month
        `,
      }),
      transformResponse: (response: MonthlyStudentStats[]) => {
        // Заполняем пропущенные месяцы нулями
        return fillMissingMonths(response);
      },
    }),

    // Получение статистики по группам за последние 6 месяцев
    getMonthlyGroupStats: builder.query<MonthlyGroupStats[], void>({
      query: () => ({
        sql: `
          SELECT 
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as count
          FROM group_entity
          WHERE created_at >= date('now', '-6 months')
          GROUP BY month
          ORDER BY month
        `,
      }),
      transformResponse: (response: MonthlyGroupStats[]) => {
        // Заполняем пропущенные месяцы нулями
        return fillMissingMonths(response);
      },
    }),

    // Получение статистики по платежам за последние 6 месяцев
    getMonthlyPaymentStats: builder.query<MonthlyPaymentStats[], void>({
      query: () => ({
        sql: `
          SELECT 
            strftime('%Y-%m', date) as month,
            COUNT(*) as count,
            SUM(amount) as totalAmount
          FROM payment
          WHERE date >= date('now', '-6 months')
          GROUP BY month
          ORDER BY month
        `,
      }),
      transformResponse: (response: MonthlyPaymentStats[]) => {
        // Заполняем пропущенные месяцы нулями
        return fillMissingMonths(response, true);
      },
    }),

    // Получение общей статистики для дашборда
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({
        sql: `
          SELECT
            (SELECT COUNT(*) FROM student) as totalStudents,
            (SELECT COUNT(*) FROM group_entity) as totalGroups,
            (SELECT COUNT(*) FROM payment) as totalPayments,
            (SELECT COALESCE(SUM(amount), 0) FROM payment) as totalPaymentAmount,
            (SELECT COUNT(*) FROM student WHERE created_at >= date('now', 'start of month')) as studentsThisMonth,
            (SELECT COUNT(*) FROM group_entity WHERE created_at >= date('now', 'start of month')) as groupsThisMonth,
            (SELECT COUNT(*) FROM payment WHERE date >= date('now', 'start of month')) as paymentsThisMonth,
            (SELECT COALESCE(SUM(amount), 0) FROM payment WHERE date >= date('now', 'start of month')) as paymentAmountThisMonth,
            (SELECT COUNT(*) FROM student WHERE date(payment_due) < date('now')) as overduePaymentsCount
        `,
      }),
      transformResponse: (response: DashboardStats[]) => {
        return response[0];
      },
    }),
    
    // Получение списка студентов с просроченными платежами
    getOverduePaymentStudents: builder.query<OverduePaymentStudent[], void>({
      query: () => ({
        sql: `
          SELECT 
            id,
            fullname,
            payment_due,
            phone_number,
            CASE
              -- Если день платежа больше чем количество дней в текущем месяце
              WHEN payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
                THEN strftime('%d', 'now') -- В этом случае платеж должен быть в последний день месяца
              -- Если текущий день месяца меньше дня платежа
              WHEN strftime('%d', 'now') < payment_due THEN 0
              -- Иначе вычисляем количество дней просрочки
              ELSE strftime('%d', 'now') - payment_due
            END as days_overdue
          FROM student
          WHERE 
            -- Если день платежа больше чем количество дней в текущем месяце, то платеж должен быть в последний день месяца
            (payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day'))) AND
             strftime('%d', 'now') = strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
            OR
            -- Обычный случай - текущий день больше дня платежа
            (payment_due <= (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day'))) AND
             payment_due < strftime('%d', 'now'))
          ORDER BY days_overdue DESC
        `,
      }),
    }),
  }),
});

// Функция для заполнения пропущенных месяцев нулями
function fillMissingMonths<T extends { month: string; count: number }>(
  data: T[],
  hasAmount = false
): T[] {
  if (!data || data.length === 0) {
    return generateEmptyMonths(hasAmount) as T[];
  }

  const result: any[] = [];
  const now = dayjs();
  const sixMonthsAgo = now.subtract(5, "month").startOf("month");
  
  // Создаем карту существующих данных
  const dataMap = new Map<string, T>();
  data.forEach(item => {
    dataMap.set(item.month, item);
  });
  
  // Заполняем все месяцы
  for (let i = 0; i < 6; i++) {
    const currentMonth = sixMonthsAgo.add(i, "month");
    const monthKey = currentMonth.format("YYYY-MM");
    
    if (dataMap.has(monthKey)) {
      result.push(dataMap.get(monthKey));
    } else {
      if (hasAmount) {
        result.push({
          month: monthKey,
          count: 0,
          totalAmount: 0
        });
      } else {
        result.push({
          month: monthKey,
          count: 0
        });
      }
    }
  }
  
  return result;
}

// Генерация пустых данных для последних 6 месяцев
function generateEmptyMonths(hasAmount = false): any[] {
  const result: any[] = [];
  const now = dayjs();
  const sixMonthsAgo = now.subtract(5, "month").startOf("month");
  
  for (let i = 0; i < 6; i++) {
    const currentMonth = sixMonthsAgo.add(i, "month");
    const monthKey = currentMonth.format("YYYY-MM");
    
    if (hasAmount) {
      result.push({
        month: monthKey,
        count: 0,
        totalAmount: 0
      });
    } else {
      result.push({
        month: monthKey,
        count: 0
      });
    }
  }
  
  return result;
}

export const {
  useGetMonthlyStudentStatsQuery,
  useGetMonthlyGroupStatsQuery,
  useGetMonthlyPaymentStatsQuery,
  useGetDashboardStatsQuery,
  useGetOverduePaymentStudentsQuery,
} = statisticsApi;
