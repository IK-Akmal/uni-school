import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery, SqlExecuteResult, SqlOperationType } from "./tauriSqlBaseQuery";
import { Student } from "../types/models";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

export const studentApi = createApi({
  reducerPath: "studentApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Student"],
  endpoints: (builder) => ({
    getStudents: builder.query<Student[], void>({
      query: () => ({
        sql: "SELECT * FROM student ORDER BY created_at DESC",
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Student" as const, id })),
              { type: "Student", id: "LIST" },
            ]
          : [{ type: "Student", id: "LIST" }],
    }),

    getStudentById: builder.query<Student, number>({
      query: (id) => ({
        sql: "SELECT * FROM student WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: Student[]) => response[0],
      providesTags: (_, __, id) => [{ type: "Student", id }],
    }),

    createStudent: builder.mutation<
      SqlExecuteResult,
      Omit<Student, "id" | "created_at">
    >({
      query: (student) => ({
        sql: "INSERT INTO student (fullname, phone_number, payment_due, address) VALUES (?, ?, ?, ?) RETURNING id",
        args: [
          student.fullname,
          student.phone_number,
          student.payment_due,
          student.address,
        ],
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: [
        { type: "Student", id: "LIST" },
      ],
    }),

    createStudentWithGroup: builder.mutation<
      void,
      { student: Omit<Student, "id" | "created_at">; groupIds?: number[] }
    >({
      async queryFn(
        { student, groupIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // Создаем студента
          const studentResult = await baseQuery({
            sql: "INSERT INTO student (fullname, phone_number, payment_due, address) VALUES (?, ?, ?, ?) RETURNING id",
            args: [
              student.fullname,
              student.phone_number,
              student.payment_due,
              student.address,
            ],
            operationType: SqlOperationType.INSERT,
          });

          if (studentResult.error) {
            return { error: studentResult.error };
          }

          const studentData = studentResult.data as SqlExecuteResult;
          const newStudentId = studentData.lastInsertId;

          if (!newStudentId) {
            return { error: { message: "Failed to get new student ID" } };
          }

          // Добавляем студента в группы, если указаны
          if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
              const groupResult = await baseQuery({
                sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                args: [newStudentId, groupId],
                useTransaction: true,
                operationType: SqlOperationType.INSERT,
              });

              if (groupResult.error) {
                return { error: groupResult.error };
              }
            }
          }

          return { data: undefined };
        } catch (error) {
          return { 
            error: { 
              message: "Failed to create student with groups", 
              details: error 
            } 
          };
        }
      },
      invalidatesTags: [
        { type: "Student", id: "LIST" },
      ],
    }),

    updateStudent: builder.mutation<void, Student>({
      query: (student) => ({
        sql: "UPDATE student SET fullname = ?, phone_number = ?, payment_due = ?, address = ? WHERE id = ?",
        args: [
          student.fullname,
          student.phone_number,
          student.payment_due,
          student.address,
          student.id,
        ],
        operationType: SqlOperationType.UPDATE,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),

    updateStudentWithGroup: builder.mutation<
      void,
      { student: Student; groupIds: number[] }
    >({
      async queryFn(
        { student, groupIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // Обновляем данные студента
          const updateResult = await baseQuery({
            sql: "UPDATE student SET fullname = ?, phone_number = ?, payment_due = ?, address = ? WHERE id = ?",
            args: [
              student.fullname,
              student.phone_number,
              student.payment_due,
              student.address,
              student.id,
            ],
            useTransaction: true,
            operationType: SqlOperationType.UPDATE,
          });

          if (updateResult.error) return { error: updateResult.error };

          // Удаляем все существующие связи студента с группами
          const deleteResult = await baseQuery({
            sql: "DELETE FROM student_group WHERE student_id = ?",
            args: [student.id],
            useTransaction: true,
            operationType: SqlOperationType.DELETE,
          });

          if (deleteResult.error) return { error: deleteResult.error };

          // Добавляем новые связи с группами
          if (groupIds && groupIds.length > 0) {
            for (const groupId of groupIds) {
              const insertResult = await baseQuery({
                sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                args: [student.id, groupId],
                useTransaction: true,
                operationType: SqlOperationType.INSERT,
              });

              if (insertResult.error) return { error: insertResult.error };
            }
          }

          return { data: undefined };
        } catch (error) {
          return { error: { message: "Failed to update student with groups" } };
        }
      },
      invalidatesTags: (_, __, { student }) => [
        { type: "Student", id: student.id },
        { type: "Student", id: "LIST" },
      ],
    }),

    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({
        sql: "DELETE FROM student WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.DELETE,
      }),
      invalidatesTags: [
        { type: "Student", id: "LIST" },
      ],
    }),

    getStudentGroups: builder.query<any[], number>({
      query: (studentId) => ({
        sql: `
          SELECT g.* 
          FROM group_entity g
          JOIN student_group sg ON g.id = sg.group_id
          WHERE sg.student_id = ?
        `,
        args: [studentId],
        operationType: SqlOperationType.SELECT,
      }),
    }),

    searchStudents: builder.query<Student[], string>({
      query: (searchTerm) => ({
        sql: `
          SELECT * FROM student 
          WHERE fullname LIKE ? OR phone_number LIKE ? OR address LIKE ?
          ORDER BY fullname ASC
        `,
        args: [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Student" as const, id })),
              { type: "Student", id: "SEARCH" },
            ]
          : [{ type: "Student", id: "SEARCH" }],
    }),

    getStudentsWithOverduePayments: builder.query<Student[], void>({
      query: () => ({
        sql: `
          SELECT s.*,
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
      providesTags: [{ type: "Student", id: "OVERDUE" }],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useCreateStudentWithGroupMutation,
  useUpdateStudentMutation,
  useUpdateStudentWithGroupMutation,
  useDeleteStudentMutation,
  useGetStudentGroupsQuery,
  useSearchStudentsQuery,
  useGetStudentsWithOverduePaymentsQuery,
} = studentApi;
