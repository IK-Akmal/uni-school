import { createApi } from "@reduxjs/toolkit/query/react";
import { createTauriSqlBaseQuery } from "./tauriSqlBaseQuery";
import { Group, Student } from "../types/models";

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
      }),
      transformResponse: (response: Group[]) => response[0],
      providesTags: (_, __, id) => [{ type: "Group", id }],
    }),

    createGroup: builder.mutation<{ id: number }, Omit<Group, "id">>({
      query: (group) => ({
        sql: "INSERT INTO group_entity (title) VALUES (?) RETURNING id",
        args: [group.title],
      }),
      transformResponse: (response: { id: number }[]) => response[0],
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),

    updateGroup: builder.mutation<void, Group>({
      query: (group) => ({
        sql: "UPDATE group_entity SET title = ? WHERE id = ?",
        args: [group.title, group.id],
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
      }),
      invalidatesTags: (_, __, { groupId }) => [
        { type: "Group", id: groupId },
        { type: "Group", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupStudentsQuery,
  useAddStudentToGroupMutation,
  useRemoveStudentFromGroupMutation,
} = groupApi;
