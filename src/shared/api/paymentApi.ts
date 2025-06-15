import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery } from "./tauriSqlBaseQuery";
import { Payment } from "../types/models";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Payment"],
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], void>({
      query: () => ({
        sql: "SELECT * FROM payment",
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
      }),
      transformResponse: (response: Payment[]) => response[0],
      providesTags: (_, __, id) => [{ type: "Payment", id }],
    }),

    createPayment: builder.mutation<number, Omit<Payment, "id">>({
      query: (payment) => ({
        sql: "INSERT INTO payment (date, amount) VALUES (?, ?) RETURNING id",
        args: [payment.date, payment.amount],
        useTransaction: true,
      }),
      transformResponse: (response: any) => response.lastInsertId,
      invalidatesTags: [{ type: "Payment", id: "LIST" }],
    }),

    updatePayment: builder.mutation<void, Payment>({
      query: (payment) => ({
        sql: "UPDATE payment SET date = ?, amount = ? WHERE id = ?",
        args: [payment.date, payment.amount, payment.id],
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
        `,
        args: [studentId],
      }),
    }),

    addPaymentToStudent: builder.mutation<
      void,
      { studentId: number; paymentId: number }
    >({
      query: ({ studentId, paymentId }) => ({
        sql: "INSERT INTO student_payment (student_id, payment_id) VALUES (?, ?)",
        args: [studentId, paymentId],
      }),
      invalidatesTags: (_, __, { paymentId }) => [
        { type: "Payment", id: paymentId },
        { type: "Payment", id: "LIST" },
      ],
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
        // Используем транзакцию для создания платежа и связывания его со студентом
        try {
          const paymentResult = await baseQuery({
            sql: "INSERT INTO payment (date, amount) VALUES (?, ?) RETURNING id",
            args: [payment.date, payment.amount],
            useTransaction: true,
          });

          if (paymentResult.error) return { error: paymentResult.error };

          const paymentId = (paymentResult.data as any).lastInsertId;

          const linkResult = await baseQuery({
            sql: "INSERT INTO student_payment (student_id, payment_id) VALUES (?, ?)",
            args: [studentId, paymentId],
            useTransaction: true,
          });

          if (linkResult.error) return { error: linkResult.error };

          // Возвращаем void вместо null для соответствия типу
          return { data: undefined };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: () => [{ type: "Payment", id: "LIST" }],
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
  useAddPaymentToStudentMutation,
  useCreateStudentPaymentMutation,
} = paymentApi;
