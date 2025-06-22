import { Drawer, Form, Input, Button, message, Select, InputNumber } from "antd";
import { useEffect } from "react";

import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useGetGroupStudentsQuery,
  useAddStudentToGroupMutation,
  useRemoveStudentFromGroupMutation,
} from "@/shared/api/groupApi";
import { useGetStudentsQuery } from "@/shared/api/studentApi";
import type { Group, Student } from "@/shared/types/models";

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  group?: Group;
  mode: "create" | "edit";
}

type FieldType = {
  title: string;
  course_price: number;
  studentIds?: number[];
};

const GroupFormModal = ({
  open,
  onClose,
  onSuccess,
  group,
  mode,
}: GroupFormModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // RTK Query хуки для создания и обновления группы
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [addStudentToGroup] = useAddStudentToGroupMutation();
  const [removeStudentFromGroup] = useRemoveStudentFromGroupMutation();

  // Получаем список всех студентов
  const { data: students, isLoading: isLoadingStudents } = useGetStudentsQuery(
    undefined,
    {
      skip: !open,
      refetchOnMountOrArgChange: true,
    }
  );

  // Получаем список студентов в группе (только для режима редактирования)
  const { data: groupStudents, isLoading: isLoadingGroupStudents } =
    useGetGroupStudentsQuery(group?.id || 0, {
      skip: mode !== "edit" || !group || !open,
      refetchOnMountOrArgChange: true,
    });

  // Сбрасываем форму при открытии и заполняем данными при редактировании
  useEffect(() => {
    if (open) {
      form.resetFields();
      if (mode === "edit" && group) {
        form.setFieldsValue({
          title: group.title,
          course_price: group.course_price,
          studentIds: groupStudents?.map((student) => student.id) || [],
        });
      }
    }
  }, [open, form, group, mode, groupStudents]);

  const onFinish = async (values: FieldType) => {
    try {
      // Создание новой группы
      if (mode === "create") {
        // Создаем группу
        const createResult = await createGroup({
          title: values.title,
          course_price: values.course_price,
        }).unwrap();
        const newGroupId = createResult?.lastInsertId;

        // Если выбраны студенты и есть ID новой группы
        if (values.studentIds && values.studentIds.length > 0 && newGroupId) {
          // Добавляем выбранных студентов в группу
          for (const studentId of values.studentIds) {
            await addStudentToGroup({
              groupId: newGroupId,
              studentId: studentId,
            });
          }
        }

        message.success("Group created successfully");
      }
      // Обновление существующей группы
      else if (mode === "edit" && group) {
        // Обновляем данные группы
        await updateGroup({ 
          id: group.id, 
          title: values.title,
          course_price: values.course_price,
          created_at: group.created_at
        });

        // Обновляем список студентов в группе
        if (groupStudents && values.studentIds) {
          const currentStudentIds = groupStudents.map((student) => student.id);
          const newStudentIds = values.studentIds;

          // Добавляем новых студентов
          for (const studentId of newStudentIds) {
            if (!currentStudentIds.includes(studentId)) {
              await addStudentToGroup({
                groupId: group.id,
                studentId: studentId,
              });
            }
          }

          // Удаляем студентов, которых больше нет в списке
          for (const studentId of currentStudentIds) {
            if (!newStudentIds.includes(studentId)) {
              await removeStudentFromGroup({
                groupId: group.id,
                studentId: studentId,
              });
            }
          }
        }

        message.success("Group updated successfully");
      }

      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} group:`,
        error
      );
      message.error(
        `Failed to ${mode === "create" ? "create" : "update"} group`
      );
    }
  };

  const isLoading = isCreating || isUpdating;
  const title = mode === "create" ? "Create Group" : "Edit Group";

  return (
    <Drawer
      title={title}
      closable={{ "aria-label": "Close Button" }}
      onClose={onClose}
      open={open}
      width={400}
    >
      <Form<FieldType>
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 24 }}
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item<FieldType>
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please input group title!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Course Price"
          name="course_price"
          rules={[
            { required: true, message: "Please input course price!" },
            { type: "number", min: 0, message: "Price must be a positive number" }
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Enter course price"
            min={0}
            precision={2}
            addonBefore="$"
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Students"
          name="studentIds"
          help="Select students to add to this group"
        >
          <Select
            showSearch
            mode="multiple"
            placeholder="Select students"
            optionFilterProp="children"
            loading={isLoadingStudents || isLoadingGroupStudents}
          >
            {students?.map((student: Student) => (
              <Select.Option key={student.id} value={student.id}>
                {student.fullname}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 0, span: 24 }}>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GroupFormModal;
