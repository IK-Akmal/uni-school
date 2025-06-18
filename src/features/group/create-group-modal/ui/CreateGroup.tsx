import { Form, message } from "antd";
import { useEffect } from "react";

import { useGetStudentsQuery } from "@/shared/api/studentApi";
import { GroupForm } from "@/shared/components/group-form";
import {
  useCreateGroupMutation,
  useAddStudentToGroupMutation,
} from "@/shared/api/groupApi";

import type { CreateGroupModalProps } from "./CreateGroup.types";
import type { FieldType } from "@/shared/components/group-form";

const CreateGroupModal = ({
  open,
  onClose,
  onSuccess,
}: CreateGroupModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список всех студентов
  const { data: students } = useGetStudentsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });

  // Используем мутации для создания группы и добавления студентов
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [addStudentToGroup, { isLoading: isAddingStudents }] =
    useAddStudentToGroupMutation();

  const isLoading = isCreating || isAddingStudents;

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const onFinish = async (values: FieldType) => {
    try {
      // Проверяем обязательные поля
      if (!values.title) {
        message.error("Please enter the group title");
        return;
      }

      // Создаем группу
      const createResult = await createGroup({
        title: values.title,
      }).unwrap();

      const newGroupId = createResult?.id;

      // Если выбраны студенты и есть ID новой группы
      if (newGroupId && values.studentIds && values.studentIds.length > 0) {
        // Добавляем выбранных студентов в группу атомарно
        const addPromises = values.studentIds.map(studentId => 
          addStudentToGroup({
            groupId: newGroupId,
            studentId: studentId,
          })
        );
        
        await Promise.all(addPromises);
      }

      message.success("Group successfully created");

      form.resetFields();

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating group:", error);
      message.error("Failed to create group");
    }
  };

  return (
    <GroupForm
      form={form}
      open={open}
      onClose={onClose}
      onFinish={onFinish}
      students={students ?? []}
      isLoading={isLoading}
      title="Create New Group"
      buttonLabel="Create Group"
    />
  );
};

export default CreateGroupModal;
