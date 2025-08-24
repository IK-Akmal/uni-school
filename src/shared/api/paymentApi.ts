import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createTauriSqlBaseQuery,
  SqlOperationType,
  SqlExecuteResult,
} from "./tauriSqlBaseQuery";
import { Payment, PaymentStudent } from "../types/models";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Payment", "StudentPayment"],
  endpoints: (builder) => ({
    getPayments: builder.query<PaymentStudent[], void>({
      query: () => ({
        sql: `SELECT
                p.id,
                p.date,
                p.amount,
                p.group_id,
                p.student_id,
                p.course_price_at_payment,
                p.payment_period,
                p.payment_type,
                p.notes,
                p.created_at,
                s.fullname AS student_fullname,
                g.title AS group_title
            FROM
                payment p
            JOIN student s ON p.student_id = s.id
            JOIN group_entity g ON p.group_id = g.id
            ORDER BY p.date DESC`,
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

    createPayment: builder.mutation<SqlExecuteResult, Omit<Payment, "id" | "created_at">>({  
      query: (payment) => ({
        sql: `INSERT INTO payment (
          date, 
          amount, 
          group_id, 
          student_id, 
          course_price_at_payment, 
          payment_period, 
          payment_type, 
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [
          payment.date, 
          payment.amount, 
          payment.group_id, 
          payment.student_id, 
          payment.course_price_at_payment, 
          payment.payment_period, 
          payment.payment_type, 
          payment.notes
        ],
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: [{ type: "Payment", id: "LIST" }, { type: "StudentPayment", id: "LIST" }],
    }),

    updatePayment: builder.mutation<void, Payment>({
      query: (payment) => ({
        sql: `UPDATE payment SET 
          date = ?, 
          amount = ?, 
          group_id = ?, 
          student_id = ?, 
          course_price_at_payment = ?, 
          payment_period = ?, 
          payment_type = ?, 
          notes = ? 
        WHERE id = ?`,
        args: [
          payment.date, 
          payment.amount, 
          payment.group_id, 
          payment.student_id, 
          payment.course_price_at_payment, 
          payment.payment_period, 
          payment.payment_type, 
          payment.notes,
          payment.id
        ],
        operationType: SqlOperationType.UPDATE,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Payment", id },
        { type: "Payment", id: "LIST" },
        { type: "StudentPayment", id: "LIST" },
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
          WHERE p.student_id = ?
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
      SqlExecuteResult,
      { studentId: number; payment: Omit<Payment, "id" | "created_at"> }
    >({
      query: ({ studentId, payment }) => ({
        sql: `INSERT INTO payment (
          date, 
          amount, 
          group_id, 
          student_id, 
          course_price_at_payment, 
          payment_period, 
          payment_type, 
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [
          payment.date, 
          payment.amount, 
          payment.group_id, 
          studentId, // используем переданный studentId
          payment.course_price_at_payment, 
          payment.payment_period, 
          payment.payment_type, 
          payment.notes
        ],
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: (_, __, { studentId }) => [
        { type: "Payment", id: "LIST" },
        { type: "StudentPayment", id: studentId },
      ],
    }),

    deleteStudentPayment: builder.mutation<
      void,
      { studentId: number; paymentId: number }
    >({
      query: ({ studentId, paymentId }) => ({
        sql: "DELETE FROM payment WHERE id = ? AND student_id = ?",
        args: [paymentId, studentId],
        operationType: SqlOperationType.DELETE,
      }),
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
          LEFT JOIN payment p ON s.id = p.student_id
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
          LEFT JOIN payment p ON s.id = p.student_id
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
