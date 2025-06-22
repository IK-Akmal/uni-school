import { createApi } from "@reduxjs/toolkit/query/react";
import { type QueryResult } from "@tauri-apps/plugin-sql";

import type { Group, Student } from "../types/models";

import { createTauriSqlBaseQuery, SqlOperationType } from "./tauriSqlBaseQuery";

// Создаем базовый запрос с именем базы данных
const tauriSqlBaseQuery = createTauriSqlBaseQuery("db.sqlite");

export const groupApi = createApi({
  reducerPath: "groupApi",
  baseQuery: tauriSqlBaseQuery,
  tagTypes: ["Group"],
  endpoints: (builder) => ({
    getGroups: builder.query<Group[], void>({
      query: () => ({
        sql: "SELECT * FROM group_entity",
        operationType: SqlOperationType.SELECT,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Group" as const, id })),
              { type: "Group", id: "LIST" },
            ]
          : [{ type: "Group", id: "LIST" }],
    }),

    getGroupById: builder.query<Group, number>({
      query: (id) => ({
        sql: "SELECT * FROM group_entity WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.SELECT,
      }),
      transformResponse: (response: Group[] | any) => {
        return Array.isArray(response) ? response[0] : response;
      },
      providesTags: (_, __, id) => [{ type: "Group", id }],
    }),

    createGroup: builder.mutation<
      QueryResult,
      Omit<Group, "id" | "created_at">
    >({
      query: (group) => ({
        sql: "INSERT INTO group_entity (title, course_price) VALUES (?, ?) RETURNING id",
        args: [group.title, group.course_price],
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    createGroupWithStudents: builder.mutation<
      QueryResult,
      { title: string; course_price: number; studentIds: number[] }
    >({
      async queryFn(
        { title, course_price, studentIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // Создаем группу
          const createResult = await baseQuery({
            sql: "INSERT INTO group_entity (title, course_price) VALUES (?, ?) RETURNING id",
            args: [title, course_price],
            operationType: SqlOperationType.INSERT,
          });

          if (createResult.error) return { error: createResult.error };

          // Получаем ID новой группы
          const data = createResult.data as any;
          let newGroupId;
          
          if (Array.isArray(data)) {
            // Если это массив (результат RETURNING)
            newGroupId = data[0]?.id;
          } else if (data && typeof data === 'object') {
            // Если это SqlExecuteResult
            newGroupId = data.lastInsertId || data.lastInsertRowid;
          }

          if (!newGroupId) {
            return { error: { message: "Failed to get new group ID" } };
          }

          // Если есть студенты, добавляем их в группу
          if (studentIds && studentIds.length > 0) {
            for (const studentId of studentIds) {
              const insertResult = await baseQuery({
                sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                args: [studentId, newGroupId],
                useTransaction: true,
                operationType: SqlOperationType.INSERT,
              });

              if (insertResult.error) return { error: insertResult.error };
            }
          }

          // Возвращаем результат с ID новой группы
          return {
            data: {
              rowsAffected: studentIds.length + 1, // группа + студенты
              lastInsertId: newGroupId,
              lastInsertRowid: newGroupId,
            },
          };
        } catch (error) {
          return { error: { message: "Failed to create group with students" } };
        }
      },
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    updateGroup: builder.mutation<void, Group>({
      query: (group) => ({
        sql: "UPDATE group_entity SET title = ?, course_price = ? WHERE id = ?",
        args: [group.title, group.course_price, group.id],
        operationType: SqlOperationType.UPDATE,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Group", id },
        { type: "Group", id: "LIST" },
      ],
    }),

    deleteGroup: builder.mutation<void, number>({
      query: (id) => ({
        sql: "DELETE FROM group_entity WHERE id = ?",
        args: [id],
        operationType: SqlOperationType.DELETE,
      }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    getGroupStudents: builder.query<Student[], number>({
      query: (groupId) => ({
        sql: `
          SELECT s.* 
          FROM student s
          JOIN student_group sg ON s.id = sg.student_id
          WHERE sg.group_id = ?
        `,
        args: [groupId],
        operationType: SqlOperationType.SELECT,
      }),
    }),

    addStudentToGroup: builder.mutation<
      void,
      { studentId: number; groupId: number }
    >({
      query: ({ studentId, groupId }) => ({
        sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
        args: [studentId, groupId],
        useTransaction: true,
        operationType: SqlOperationType.INSERT,
      }),
      invalidatesTags: (_, __, { groupId }) => [
        { type: "Group", id: groupId },
        { type: "Group", id: "LIST" },
      ],
    }),

    removeStudentFromGroup: builder.mutation<
      void,
      { studentId: number; groupId: number }
    >({
      query: ({ studentId, groupId }) => ({
        sql: "DELETE FROM student_group WHERE student_id = ? AND group_id = ?",
        args: [studentId, groupId],
        operationType: SqlOperationType.DELETE,
      }),
      invalidatesTags: (_, __, { groupId }) => [
        { type: "Group", id: groupId },
        { type: "Group", id: "LIST" },
      ],
    }),

    updateGroupWithStudents: builder.mutation<
      void,
      { group: Omit<Group, "created_at">; studentIds?: number[] }
    >({
      async queryFn(
        { group, studentIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        // Используем транзакцию для обновления группы и связей со студентами
        try {
          // Обновляем данные группы
          const updateResult = await baseQuery({
            sql: "UPDATE group_entity SET title = ? WHERE id = ?",
            args: [group.title, group.id],
            useTransaction: true,
            operationType: SqlOperationType.UPDATE,
          });

          if (updateResult.error) return { error: updateResult.error };

          // Если указаны студенты, обновляем связи группа-студент
          if (studentIds !== undefined) {
            // Удаляем все текущие связи группы со студентами
            const deleteResult = await baseQuery({
              sql: "DELETE FROM student_group WHERE group_id = ?",
              args: [group.id],
              useTransaction: true,
              operationType: SqlOperationType.DELETE,
            });

            if (deleteResult.error) return { error: deleteResult.error };

            // Добавляем новые связи группы со студентами
            if (studentIds && studentIds.length > 0) {
              for (const studentId of studentIds) {
                const insertResult = await baseQuery({
                  sql: "INSERT INTO student_group (student_id, group_id) VALUES (?, ?)",
                  args: [studentId, group.id],
                  operationType: SqlOperationType.INSERT,
                });

                if (insertResult.error) return { error: insertResult.error };
              }
            }
          }

          return { data: undefined };
        } catch (error) {
          return { error: { message: "Failed to update group with students" } };
        }
      },
      invalidatesTags: (_, __, { group }) => [
        { type: "Group", id: group.id },
        { type: "Group", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useCreateGroupWithStudentsMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupStudentsQuery,
  useAddStudentToGroupMutation,
  useRemoveStudentFromGroupMutation,
  useUpdateGroupWithStudentsMutation,
} = groupApi;
