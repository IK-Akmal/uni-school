import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createTauriSqlBaseQuery,
  SqlOperationType,
  SqlExecuteResult,
} from "./tauriSqlBaseQuery";
import { Payment } from "../types/models";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Payment", "StudentPayment"],
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], void>({
      query: () => ({
        sql: "SELECT * FROM payment ORDER BY date DESC",
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Payment" as const, id })),
              { type: "Payment", id: "LIST" },
            ]
          : [{ type: "Payment", id: "LIST" }],
    }),

    getPaymentById: builder.query<Payment, number>({
      query: (id) => ({
        sql: "SELECT * FROM payment WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: Payment[] | any) => {
        return Array.isArray(response) ? response[0] : response;
      },
      providesTags: (_, __, id) => [{ type: "Payment", id }],
    }),

    createPayment: builder.mutation<SqlExecuteResult, Omit<Payment, "id">>({
      query: (payment) => ({
        sql: "INSERT INTO payment (date, amount) VALUES (?, ?) RETURNING id",
        args: [payment.date, payment.amount],
        useTransaction: true,
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }],
    }),

    updatePayment: builder.mutation<void, Payment>({
      query: (payment) => ({
        sql: "UPDATE payment SET date = ?, amount = ? WHERE id = ?",
        args: [payment.date, payment.amount, payment.id],
        operationType: SqlOperationType.UPDATE,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Payment", id },
        { type: "Payment", id: "LIST" },
      ],
    }),

    deletePayment: builder.mutation<void, number>({
      query: (id) => ({
        sql: "DELETE FROM payment WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.DELETE,
      }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }],
    }),

    getStudentPayments: builder.query<Payment[], number>({
      query: (studentId) => ({
        sql: `
          SELECT p.* 
          FROM payment p
          JOIN student_payment sp ON p.id = sp.payment_id
          WHERE sp.student_id = ?
          ORDER BY p.date DESC
        `,
        args: [studentId],
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: (result, _, studentId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Payment" as const, id })),
              { type: "StudentPayment", id: studentId },
            ]
          : [{ type: "StudentPayment", id: studentId }],
    }),

    createStudentPayment: builder.mutation<
      void,
      { studentId: number; payment: Omit<Payment, "id"> }
    >({
      async queryFn(
        { studentId, payment },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // Создаем платеж
          const paymentResult = await baseQuery({
            sql: "INSERT INTO payment (date, amount) VALUES (?, ?) RETURNING id",
            args: [payment.date, payment.amount],
            operationType: SqlOperationType.INSERT,
          });

          if (paymentResult.error) {
            return { error: paymentResult.error };
          }

          const paymentData = paymentResult.data as SqlExecuteResult;
          const newPaymentId = paymentData.lastInsertId;

          if (!newPaymentId) {
            return { error: { message: "Failed to get new payment ID" } };
          }

          // Связываем платеж со студентом
          const linkResult = await baseQuery({
            sql: "INSERT INTO student_payment (student_id, payment_id) VALUES (?, ?)",
            args: [studentId, newPaymentId],
            operationType: SqlOperationType.INSERT,
          });

          if (linkResult.error) {
            return { error: linkResult.error };
          }

          return { data: undefined };
        } catch (error) {
          return {
            error: {
              message: "Failed to create student payment",
              details: error,
            },
          };
        }
      },
      invalidatesTags: (_, __, { studentId }) => [
        { type: "Payment", id: "LIST" },
        { type: "StudentPayment", id: studentId },
      ],
    }),

    deleteStudentPayment: builder.mutation<
      void,
      { studentId: number; paymentId: number }
    >({
      async queryFn(
        { studentId, paymentId },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // Удаляем связь студент-платеж
          const unlinkResult = await baseQuery({
            sql: "DELETE FROM student_payment WHERE student_id = ? AND payment_id = ?",
            args: [studentId, paymentId],
            useTransaction: true,
            operationType: SqlOperationType.DELETE,
          });

          if (unlinkResult.error) {
            return { error: unlinkResult.error };
          }

          // Проверяем, есть ли еще связи с этим платежом
          const checkResult = await baseQuery({
            sql: "SELECT COUNT(*) as count FROM student_payment WHERE payment_id = ?",
            args: [paymentId],
            operationType: SqlOperationType.SELECT,
          });

          if (checkResult.error) {
            return { error: checkResult.error };
          }

          const checkData = Array.isArray(checkResult.data)
            ? (checkResult.data as { count: number }[])
            : [];

          if (checkData[0]?.count === 0) {
            // Если нет других связей, удаляем сам платеж
            const deleteResult = await baseQuery({
              sql: "DELETE FROM payment WHERE id = ?",
              args: [paymentId],
              useTransaction: true,
              operationType: SqlOperationType.DELETE,
            });

            if (deleteResult.error) {
              return { error: deleteResult.error };
            }
          }

          return { data: undefined };
        } catch (error) {
          return {
            error: {
              message: "Failed to delete student payment",
              details: error,
            },
          };
        }
      },
      invalidatesTags: (_, __, { studentId }) => [
        { type: "Payment", id: "LIST" },
        { type: "StudentPayment", id: studentId },
      ],
    }),

    getPaymentsByDateRange: builder.query<
      Payment[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        sql: `
          SELECT * FROM payment 
          WHERE date BETWEEN ? AND ? 
          ORDER BY date DESC
        `,
        args: [startDate, endDate],
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Payment", id: "DATE_RANGE" }],
    }),

    getTotalPaymentsByStudent: builder.query<
      { student_id: number; fullname: string; total_amount: number }[],
      void
    >({
      query: () => ({
        sql: `
          SELECT 
            s.id as student_id,
            s.fullname,
            COALESCE(SUM(p.amount), 0) as total_amount
          FROM student s
          LEFT JOIN student_payment sp ON s.id = sp.student_id
          LEFT JOIN payment p ON sp.payment_id = p.id
          GROUP BY s.id, s.fullname
          ORDER BY total_amount DESC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Payment", id: "TOTALS" }],
    }),

    getPaymentStudents: builder.query<
      {
        student_id: number;
        fullname: string;
        phone_number: string;
        payment_due: number;
        payment_id?: number;
        amount?: number;
        date?: string;
      }[],
      void
    >({
      query: () => ({
        sql: `
          SELECT 
            s.id as student_id,
            s.fullname,
            s.phone_number,
            s.payment_due,
            p.id as payment_id,
            p.amount,
            p.date
          FROM student s
          LEFT JOIN student_payment sp ON s.id = sp.student_id
          LEFT JOIN payment p ON sp.payment_id = p.id
          ORDER BY s.fullname ASC, p.date DESC
        `,
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: [{ type: "Payment", id: "STUDENT_PAYMENTS" }],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetStudentPaymentsQuery,
  useCreateStudentPaymentMutation,
  useDeleteStudentPaymentMutation,
  useGetPaymentsByDateRangeQuery,
  useGetTotalPaymentsByStudentQuery,
  useGetPaymentStudentsQuery,
  useLazyGetPaymentsQuery,
  useLazyGetPaymentByIdQuery,
  useLazyGetStudentPaymentsQuery,
  useLazyGetPaymentsByDateRangeQuery,
  useLazyGetTotalPaymentsByStudentQuery,
} = paymentApi;
