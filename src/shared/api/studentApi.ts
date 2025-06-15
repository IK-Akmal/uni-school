import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery, SqlExecuteResult } from "./tauriSqlBaseQuery";
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
        sql: "SELECT * FROM student",
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
      }),
      transformResponse: (response: Student[]) => response[0],
      providesTags: (_, __, id) => [{ type: "Student", id }],
    }),

    createStudentWithGroup: builder.mutation<
      void,
      { student: Omit<Student, "id">; groupIds?: number[] }
    >({
      async queryFn(
        { student, groupIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        // Используем транзакцию для создания студента и добавления его в группы
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
            useTransaction: true,
          });

          if (studentResult.error) return { error: studentResult.error };

          // Проверяем результат и получаем ID созданного студента
          if (!studentResult.data) {
            return { error: { message: "Failed to create student" } };
          }

          // Получаем ID созданного студента из результата execute
          const executeResult = studentResult.data as SqlExecuteResult;
          const studentId = executeResult.lastInsertId;

          if (!studentId) {
            return { error: { message: "Failed to get student ID" } };
          }

          // Если указаны ID групп, добавляем студента в каждую группу
          if (groupIds && groupIds.length > 0) {
            // Создаем запросы для добавления студента в каждую группу
            for (const groupId of groupIds) {
              const linkResult = await baseQuery({
                sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                args: [studentId, groupId],
                useTransaction: true,
              });

              if (linkResult.error) return { error: linkResult.error };
            }
          }

          return { data: undefined };
        } catch (error) {
          return { error: error as Error };
        }
      },
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    createStudent: builder.mutation<void, Omit<Student, "id">>({
      query: (student) => ({
        sql: "INSERT INTO student (fullname, phone_number, payment_due, address) VALUES (?, ?, ?, ?)",
        args: [
          student.fullname,
          student.phone_number,
          student.payment_due,
          student.address,
        ],
      }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    updateStudentWithGroup: builder.mutation<
      void,
      { student: Student; groupIds?: number[] }
    >({
      async queryFn(
        { student, groupIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        // Используем транзакцию для обновления студента и его связей с группами
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
          });

          if (updateResult.error) return { error: updateResult.error };

          // Если указаны группы, обновляем связи студент-группа
          if (groupIds !== undefined) {
            // Удаляем все текущие связи студента с группами
            const deleteResult = await baseQuery({
              sql: "DELETE FROM student_group WHERE student_id = ?",
              args: [student.id],
            });

            if (deleteResult.error) return { error: deleteResult.error };

            // Добавляем новые связи студента с группами
            if (groupIds && groupIds.length > 0) {
              for (const groupId of groupIds) {
                const insertResult = await baseQuery({
                  sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                  args: [student.id, groupId],
                });

                if (insertResult.error) return { error: insertResult.error };
              }
            }
          }

          return { data: undefined };
        } catch (error) {
          return { error: { message: "Failed to update student with groups" } };
        }
      },
      invalidatesTags: (_, __, { student }) => {
        console.log({ student });
        return [
          { type: "Student", id: student.id },
          // { type: "Student", id: "LIST" },
        ];
      },
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
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),

    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({
        sql: "DELETE FROM student WHERE id = ?",
        args: [id],
      }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    getStudentGroups: builder.query<{ id: number }[], number>({
      query: (studentId) => ({
        sql: `
          SELECT g.id
          FROM group_entity g
          JOIN student_group sg ON g.id = sg.group_id
          WHERE sg.student_id = ?
        `,
        args: [studentId],
      }),
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
} = studentApi;
