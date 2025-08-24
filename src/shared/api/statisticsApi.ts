import dayjs from "dayjs";
import { createApi } from "@reduxjs/toolkit/query/react";

import { createTauriSqlBaseQuery, SqlOperationType } from "./tauriSqlBaseQuery";
import type { StudentMonthlyDebt } from "../types/models";

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
  remaining_amount: number;
  last_payment_date?: string;
}

export interface UpcomingPaymentStudent {
  id: number;
  fullname: string;
  payment_due: number;
  phone_number: string;
  days_until_due: number;
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
              details: error,
            },
          };
        }
      },
      providesTags: [{ type: "Statistics", id: "DASHBOARD" }],
    }),

    // Получение студентов с просроченными платежами (включая частичные платежи)
    getOverduePaymentStudents: builder.query<OverduePaymentStudent[], void>({
      query: () => ({
        sql: `
          WITH student_groups AS (
            SELECT 
              s.id as student_id,
              s.fullname as student_fullname,
              s.phone_number,
              s.payment_due,
              COALESCE(SUM(g.course_price), 0) as total_course_price,
              GROUP_CONCAT(
                CASE WHEN g.id IS NOT NULL THEN
                  json_object(
                    'group_id', g.id,
                    'group_title', g.title,
                    'course_price', g.course_price
                  )
                END,
                '||'
              ) as groups_json
            FROM student s
            LEFT JOIN student_group sg ON s.id = sg.student_id
            LEFT JOIN group_entity g ON sg.group_id = g.id
            GROUP BY s.id, s.fullname, s.phone_number, s.payment_due
          ),
          student_payments_this_month AS (
            SELECT 
              p.student_id,
              SUM(p.amount) as paid_this_month,
              SUM(p.course_price_at_payment) as expected_this_month,
              MAX(p.date) as last_payment_date,
              strftime('%Y-%m', MAX(p.date)) as last_payment_period
            FROM payment p
            WHERE strftime('%Y-%m', p.date) = strftime('%Y-%m', 'now')
            GROUP BY p.student_id
          ),
          overdue_calculations AS (
            SELECT 
              sg.student_id,
              sg.student_fullname,
              sg.phone_number,
              sg.payment_due,
              sg.total_course_price,
              COALESCE(spm.paid_this_month, 0) as paid_this_month,
              COALESCE(spm.expected_this_month, sg.total_course_price) as expected_amount_this_month,
              COALESCE(spm.expected_this_month, sg.total_course_price) - COALESCE(spm.paid_this_month, 0) as remaining_amount,
              spm.last_payment_date,
              spm.last_payment_period,
              strftime('%Y-%m', 'now') as current_period,
              CAST(strftime('%d', 'now') AS INTEGER) as current_day,
              -- Эффективный день платежа (не больше дней в месяце)
              CASE 
                WHEN sg.payment_due > CAST(strftime('%d', date('now', 'start of month', '+1 month', '-1 day')) AS INTEGER)
                THEN CAST(strftime('%d', date('now', 'start of month', '+1 month', '-1 day')) AS INTEGER)
                ELSE sg.payment_due
              END as effective_payment_due
            FROM student_groups sg
            LEFT JOIN student_payments_this_month spm ON sg.student_id = spm.student_id
          )
          SELECT 
            student_id as id,
            student_fullname as fullname,
            payment_due,
            phone_number,
            last_payment_date,
            remaining_amount,
            CASE
              WHEN current_day >= effective_payment_due 
              THEN current_day - effective_payment_due
              ELSE 0
            END as days_overdue
          FROM overdue_calculations
          WHERE (
            -- Условие 1: Студент не платил в этом месяце И прошел срок платежа
            (last_payment_period IS NULL OR last_payment_period < current_period) 
            AND current_day >= effective_payment_due
          ) OR (
            -- Условие 2: Студент платил частично (остался долг > 0)
            remaining_amount > 0
            AND current_day >= effective_payment_due
          )
          ORDER BY days_overdue DESC, remaining_amount DESC, student_fullname ASC
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
      {
        student_id: number;
        fullname: string;
        total_amount: number;
        payment_count: number;
      }[],
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
          LEFT JOIN payment p ON s.id = p.student_id
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

    // Получение студентов, которые должны заплатить в ближайшие дни
    getUpcomingPaymentStudents: builder.query<
      UpcomingPaymentStudent[],
      { daysAhead?: number }
    >({
      query: ({ daysAhead = 3 }) => ({
        sql: `
          WITH current_period AS (
            SELECT strftime('%Y-%m', 'now') as period
          ),
          student_payments AS (
            SELECT 
              s.id,
              s.fullname,
              s.payment_due,
              s.phone_number,
              MAX(p.date) as last_payment_date,
              strftime('%Y-%m', MAX(p.date)) as last_payment_period
            FROM student s
            LEFT JOIN payment p ON s.id = p.student_id
            GROUP BY s.id, s.fullname, s.payment_due, s.phone_number
          )
          SELECT 
            sp.id,
            sp.fullname,
            sp.payment_due,
            sp.phone_number,
            (
              CASE
                WHEN sp.payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
                  THEN sp.payment_due - strftime('%d', 'now')
                WHEN strftime('%d', 'now') < sp.payment_due 
                  THEN sp.payment_due - strftime('%d', 'now')
                ELSE 0
              END
            ) as days_until_due
          FROM student_payments sp
          WHERE (
            -- Студент не платил в этом месяце
            sp.last_payment_period IS NULL OR 
            sp.last_payment_period < (SELECT period FROM current_period)
          )
          AND (
            -- До срока платежа осталось от 0 до указанного количества дней
            CASE
              WHEN sp.payment_due > (strftime('%d', date(strftime('%Y-%m', 'now') || '-01', '+1 month', '-1 day')))
                THEN sp.payment_due - strftime('%d', 'now')
              WHEN strftime('%d', 'now') < sp.payment_due 
                THEN sp.payment_due - strftime('%d', 'now')
              ELSE 0
            END
          ) BETWEEN 0 AND ?
          ORDER BY days_until_due ASC
        `,
        args: [daysAhead],
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Statistics", id: "UPCOMING_PAYMENTS" }],
    }),

    // Расчет общей суммы к оплате в месяц для всех студентов (Для Debtors Management)
    getStudentMonthlyDebts: builder.query<StudentMonthlyDebt[], void>({
      query: () => ({
        sql: `
          WITH student_groups AS (
            SELECT 
              s.id as student_id,
              s.fullname as student_fullname,
              s.phone_number,
              s.payment_due,
              COALESCE(SUM(g.course_price), 0) as total_course_price,
              COUNT(CASE WHEN sg.group_id IS NOT NULL THEN 1 END) as groups_count,
              GROUP_CONCAT(
                CASE WHEN g.id IS NOT NULL THEN
                  json_object(
                    'group_id', g.id,
                    'group_title', g.title,
                    'course_price', g.course_price
                  )
                END,
                '||'
              ) as groups_json
            FROM student s
            LEFT JOIN student_group sg ON s.id = sg.student_id
            LEFT JOIN group_entity g ON sg.group_id = g.id
            GROUP BY s.id, s.fullname, s.phone_number, s.payment_due
          ),
          student_payments_this_month AS (
            SELECT 
              p.student_id,
              SUM(p.amount) as paid_this_month,
              SUM(p.course_price_at_payment) as expected_this_month,
              MAX(p.date) as last_payment_date
            FROM payment p
            WHERE strftime('%Y-%m', p.date) = strftime('%Y-%m', 'now')
            GROUP BY p.student_id
          )
          SELECT 
            sg.student_id,
            sg.student_fullname,
            sg.phone_number,
            sg.payment_due,
            sg.total_course_price,
            COALESCE(spm.paid_this_month, 0) as paid_this_month,
            COALESCE(spm.expected_this_month, sg.total_course_price) as expected_amount_this_month,
            COALESCE(spm.expected_this_month, sg.total_course_price) - COALESCE(spm.paid_this_month, 0) as total_monthly_amount,
            sg.groups_count,
            sg.groups_json,
            spm.last_payment_date,
            CASE 
              WHEN sg.payment_due < CAST(strftime('%d', 'now') AS INTEGER) THEN 
                CAST(strftime('%d', 'now') AS INTEGER) - sg.payment_due
              ELSE 0
            END as days_overdue
          FROM student_groups sg
          LEFT JOIN student_payments_this_month spm ON sg.student_id = spm.student_id
          ORDER BY sg.student_fullname ASC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: any[]) => {
        return response.map((row) => {
          // Парсим JSON строку с группами
          let groups = [];
          if (row.groups_json) {
            try {
              const groupsArray = row.groups_json
                .split("||")
                .filter((groupStr: string) => groupStr.trim())
                .map((groupStr: string) => JSON.parse(groupStr.trim()));
              groups = groupsArray;
            } catch (error) {
              console.error("Error parsing groups JSON:", error);
              groups = [];
            }
          }

          const daysOverdue = row.days_overdue || 0;

          return {
            student_id: row.student_id,
            student_fullname: row.student_fullname,
            phone_number: row.phone_number,
            payment_due: row.payment_due,
            total_course_price: row.total_course_price || 0,
            paid_this_month: row.paid_this_month || 0,
            total_monthly_amount: row.total_monthly_amount || 0,
            groups_count: row.groups_count || 0,
            groups: groups,
            last_payment_date: row.last_payment_date || undefined,
            days_overdue: daysOverdue,
            is_overdue: daysOverdue > 0,
          };
        });
      },
      providesTags: [{ type: "Statistics", id: "MONTHLY_DEBTS" }],
    }),
  }),
});

// Функция для заполнения пропущенных месяцев нулями
function fillMissingMonths<T extends { month: string; count: number }>(
  data: T[],
  hasAmount = false
): T[] {
  const emptyMonths = generateEmptyMonths(hasAmount);
  const dataMap = new Map(data.map((item) => [item.month, item]));

  return emptyMonths.map((emptyMonth) => {
    const existing = dataMap.get(emptyMonth.month);
    return existing || emptyMonth;
  }) as T[];
}

// Генерация пустых данных для последних 6 месяцев
function generateEmptyMonths(hasAmount = false): any[] {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = dayjs().subtract(i, "month").format("YYYY-MM");
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
  useGetUpcomingPaymentStudentsQuery,
  useGetStudentMonthlyDebtsQuery,
} = statisticsApi;
