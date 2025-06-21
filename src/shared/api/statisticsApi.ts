import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery, SqlOperationType } from "./tauriSqlBaseQuery";
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

export interface StudentGrowthStats {
  period: string;
  newStudents: number;
  totalStudents: number;
  growthRate: number;
}

export interface PaymentTrendStats {
  period: string;
  amount: number;
  count: number;
  averageAmount: number;
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
          GROUP BY strftime('%Y-%m', created_at)
          ORDER BY month ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: MonthlyStudentStats[]) => {
        return fillMissingMonths(response);
      },
      providesTags: [{ type: "Statistics", id: "MONTHLY_STUDENTS" }],
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
          GROUP BY strftime('%Y-%m', created_at)
          ORDER BY month ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: MonthlyGroupStats[]) => {
        return fillMissingMonths(response);
      },
      providesTags: [{ type: "Statistics", id: "MONTHLY_GROUPS" }],
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
          GROUP BY strftime('%Y-%m', date)
          ORDER BY month ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: MonthlyPaymentStats[]) => {
        return fillMissingMonths(response, true);
      },
      providesTags: [{ type: "Statistics", id: "MONTHLY_PAYMENTS" }],
    }),

    // Получение общей статистики для дашборда
    getDashboardStats: builder.query<DashboardStats, void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        try {
          // Общая статистика
          const totalStatsResult = await baseQuery({
            sql: `
              SELECT 
                (SELECT COUNT(*) FROM student) as totalStudents,
                (SELECT COUNT(*) FROM group_entity) as totalGroups,
                (SELECT COUNT(*) FROM payment) as totalPayments,
                (SELECT COALESCE(SUM(amount), 0) FROM payment) as totalPaymentAmount
            `,
            operationType: SqlOperationType.SELECT,
          });

          if (totalStatsResult.error) {
            return { error: totalStatsResult.error };
          }

          // Статистика за текущий месяц
          const monthlyStatsResult = await baseQuery({
            sql: `
              SELECT 
                (SELECT COUNT(*) FROM student WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as studentsThisMonth,
                (SELECT COUNT(*) FROM group_entity WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as groupsThisMonth,
                (SELECT COUNT(*) FROM payment WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')) as paymentsThisMonth,
                (SELECT COALESCE(SUM(amount), 0) FROM payment WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')) as paymentAmountThisMonth
            `,
            operationType: SqlOperationType.SELECT,
          });

          if (monthlyStatsResult.error) {
            return { error: monthlyStatsResult.error };
          }

          // Количество студентов с просроченными платежами
          const overdueResult = await baseQuery({
            sql: `
              SELECT COUNT(*) as overduePaymentsCount
              FROM student s
              WHERE 
                CASE
                  WHEN s.payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
                    THEN strftime('%d', 'now')
                  WHEN strftime('%d', 'now') < s.payment_due THEN 0
                  ELSE strftime('%d', 'now') - s.payment_due
                END > 0
            `,
            operationType: SqlOperationType.SELECT,
          });

          if (overdueResult.error) {
            return { error: overdueResult.error };
          }

          const totalStats = (totalStatsResult.data as any[])[0];
          const monthlyStats = (monthlyStatsResult.data as any[])[0];
          const overdueStats = (overdueResult.data as any[])[0];

          const dashboardStats: DashboardStats = {
            ...totalStats,
            ...monthlyStats,
            ...overdueStats,
          };

          return { data: dashboardStats };
        } catch (error) {
          return { 
            error: { 
              message: "Failed to get dashboard statistics", 
              details: error 
            } 
          };
        }
      },
      providesTags: [{ type: "Statistics", id: "DASHBOARD" }],
    }),

    // Получение студентов с просроченными платежами
    getOverduePaymentStudents: builder.query<OverduePaymentStudent[], void>({
      query: () => ({
        sql: `
          SELECT 
            s.id,
            s.fullname,
            s.payment_due,
            s.phone_number,
            CASE
              WHEN s.payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
                THEN strftime('%d', 'now')
              WHEN strftime('%d', 'now') < s.payment_due THEN 0
              ELSE strftime('%d', 'now') - s.payment_due
            END as days_overdue
          FROM student s
          WHERE days_overdue > 0
          ORDER BY days_overdue DESC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Statistics", id: "OVERDUE_PAYMENTS" }],
    }),

    // Получение статистики роста студентов
    getStudentGrowthStats: builder.query<StudentGrowthStats[], void>({
      query: () => ({
        sql: `
          WITH monthly_data AS (
            SELECT 
              strftime('%Y-%m', created_at) as period,
              COUNT(*) as newStudents
            FROM student 
            WHERE created_at >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', created_at)
          ),
          cumulative_data AS (
            SELECT 
              period,
              newStudents,
              SUM(newStudents) OVER (ORDER BY period) as totalStudents
            FROM monthly_data
          )
          SELECT 
            period,
            newStudents,
            totalStudents,
            CASE 
              WHEN LAG(totalStudents) OVER (ORDER BY period) = 0 THEN 0
              ELSE ROUND(
                ((totalStudents - LAG(totalStudents) OVER (ORDER BY period)) * 100.0 / 
                LAG(totalStudents) OVER (ORDER BY period)), 2
              )
            END as growthRate
          FROM cumulative_data
          ORDER BY period ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Statistics", id: "STUDENT_GROWTH" }],
    }),

    // Получение трендов платежей
    getPaymentTrendStats: builder.query<PaymentTrendStats[], void>({
      query: () => ({
        sql: `
          SELECT 
            strftime('%Y-%m', date) as period,
            SUM(amount) as amount,
            COUNT(*) as count,
            ROUND(AVG(amount), 2) as averageAmount
          FROM payment 
          WHERE date >= date('now', '-12 months')
          GROUP BY strftime('%Y-%m', date)
          ORDER BY period ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Statistics", id: "PAYMENT_TRENDS" }],
    }),

    // Получение топ студентов по платежам
    getTopPayingStudents: builder.query<
      { student_id: number; fullname: string; total_amount: number; payment_count: number }[],
      { limit?: number }
    >({
      query: ({ limit = 10 }) => ({
        sql: `
          SELECT 
            s.id as student_id,
            s.fullname,
            COALESCE(SUM(p.amount), 0) as total_amount,
            COUNT(p.id) as payment_count
          FROM student s
          LEFT JOIN student_payment sp ON s.id = sp.student_id
          LEFT JOIN payment p ON sp.payment_id = p.id
          GROUP BY s.id, s.fullname
          HAVING total_amount > 0
          ORDER BY total_amount DESC
          LIMIT ?
        `,
        args: [limit],
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Statistics", id: "TOP_PAYING_STUDENTS" }],
    }),
  }),
});

// Функция для заполнения пропущенных месяцев нулями
function fillMissingMonths<T extends { month: string; count: number }>(
  data: T[],
  hasAmount = false
): T[] {
  const emptyMonths = generateEmptyMonths(hasAmount);
  const dataMap = new Map(data.map(item => [item.month, item]));
  
  return emptyMonths.map(emptyMonth => {
    const existing = dataMap.get(emptyMonth.month);
    return existing || emptyMonth;
  }) as T[];
}

// Генерация пустых данных для последних 6 месяцев
function generateEmptyMonths(hasAmount = false): any[] {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = dayjs().subtract(i, 'month').format('YYYY-MM');
    const emptyData: any = {
      month,
      count: 0,
    };
    
    if (hasAmount) {
      emptyData.totalAmount = 0;
    }
    
    months.push(emptyData);
  }
  return months;
}

export const {
  useGetMonthlyStudentStatsQuery,
  useGetMonthlyGroupStatsQuery,
  useGetMonthlyPaymentStatsQuery,
  useGetDashboardStatsQuery,
  useGetOverduePaymentStudentsQuery,
  useGetStudentGrowthStatsQuery,
  useGetPaymentTrendStatsQuery,
  useGetTopPayingStudentsQuery,
} = statisticsApi;
