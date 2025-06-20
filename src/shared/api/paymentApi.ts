import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery } from "./tauriSqlBaseQuery";
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

    getPaymentStudents: builder.query<
      { paymentId: number; studentId: number; fullname: string }[],
      void
    >({
      query: () => ({
        sql: `
          SELECT sp.payment_id, sp.student_id, s.fullname 
          FROM student_payment sp
          JOIN student s ON sp.student_id = s.id
        `,
      }),
      transformResponse: (response: any[]) => {
        return response.map((item) => ({
          paymentId: item.payment_id,
          studentId: item.student_id,
          fullname: item.fullname,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ paymentId }) => ({
                type: "StudentPayment" as const,
                id: paymentId,
              })),
              { type: "StudentPayment", id: "LIST" },
            ]
          : [{ type: "StudentPayment", id: "LIST" }],
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
        { type: "StudentPayment", id: paymentId },
        { type: "StudentPayment", id: "LIST" },
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
          // Начинаем транзакцию
          await baseQuery({
            sql: "BEGIN TRANSACTION",
          });

          try {
            // Создаем платеж
            const paymentResult = await baseQuery({
              sql: "INSERT INTO payment (date, amount) VALUES (?, ?) RETURNING id",
              args: [payment.date, payment.amount],
            });

            if (paymentResult.error) {
              // Отменяем транзакцию при ошибке
              await baseQuery({
                sql: "ROLLBACK",
              });
              return { error: paymentResult.error };
            }

            const paymentId = (paymentResult.data as any).lastInsertId;

            // Связываем платеж со студентом
            const linkResult = await baseQuery({
              sql: "INSERT INTO student_payment (student_id, payment_id) VALUES (?, ?)",
              args: [studentId, paymentId],
            });

            if (linkResult.error) {
              // Отменяем транзакцию при ошибке
              await baseQuery({
                sql: "ROLLBACK",
              });
              return { error: linkResult.error };
            }

            // Завершаем транзакцию
            await baseQuery({
              sql: "COMMIT",
            });

            // Возвращаем void вместо null для соответствия типу
            return { data: undefined };
          } catch (innerError) {
            // Отменяем транзакцию при любой ошибке
            await baseQuery({
              sql: "ROLLBACK",
            });
            return { error: innerError };
          }
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: () => [
        { type: "Payment", id: "LIST" },
        // Добавляем тег для обновления связей студентов с платежами
        { type: "StudentPayment", id: "LIST" },
      ],
    }),

    // Обновление платежа
    updatePayment: builder.mutation<
      void,
      { id: number; date: string; amount: number }
    >({
      query: ({ id, date, amount }) => ({
        sql: "UPDATE payment SET date = ?, amount = ? WHERE id = ?",
        args: [date, amount, id],
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Payment", id: id.toString() },
        { type: "Payment", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetStudentPaymentsQuery,
  useGetPaymentStudentsQuery,
  useAddPaymentToStudentMutation,
  useCreateStudentPaymentMutation,
  useUpdatePaymentMutation,
} = paymentApi;
