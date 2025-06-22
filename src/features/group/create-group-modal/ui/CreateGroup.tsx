import { Form, message } from "antd";
import { useEffect } from "react";

import { useGetStudentsQuery } from "@/shared/api/studentApi";
import { GroupForm } from "@/shared/components/group-form";
import { useCreateGroupWithStudentsMutation } from "@/shared/api/groupApi";

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

  // Используем мутацию для создания группы с студентами
  const [createGroupWithStudents, { isLoading }] = useCreateGroupWithStudentsMutation();

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

      if (!values.course_price || values.course_price <= 0) {
        message.error("Please enter a valid course price");
        return;
      }

      // Создаем группу с студентами в одной транзакции
      await createGroupWithStudents({
        title: values.title,
        course_price: values.course_price,
        studentIds: values.studentIds || [],
      }).unwrap();

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
