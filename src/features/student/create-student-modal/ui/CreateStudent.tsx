import { Form, message } from "antd";
import { useEffect } from "react";

import { useGetGroupsQuery } from "@/shared/api/groupApi";
import { StudentForm } from "@/shared/components/student-form";
import { useCreateStudentWithGroupMutation } from "@/shared/api/studentApi";

import type { CreateStudentModalProps, FieldType } from "./CreateStudent.types";

const CreateStudentModal = ({
  open,
  onClose,
  onSuccess,
}: CreateStudentModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список групп
  const { data: groups } = useGetGroupsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });

  // Используем новый мутационный хук для создания студента с группой
  const [createStudentWithGroup, { isLoading }] =
    useCreateStudentWithGroupMutation();

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const onFinish = async (values: FieldType) => {
    try {
      // Проверяем обязательные поля
      if (!values.fullname || !values.phone_number) {
        message.error("Please fill in all required fields");
        return;
      }

      // Создаем объект студента
      const student = {
        fullname: values.fullname,
        phone_number: values.phone_number,
        payment_due: values.payment_due || "0",
        address: values.address || "",
      };

      // Вызываем API для создания студента с группами
      await createStudentWithGroup({
        student,
        groupIds: values.groupIds,
      });

      message.success("Student successfully created");

      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating student:", error);
      message.error("Failed to create student");
    }
  };

  return (
    <StudentForm
      form={form}
      open={open}
      onClose={onClose}
      onFinish={onFinish}
      groups={groups ?? []}
      isLoading={isLoading}
      title="Create New Student"
      buttonLabel="Create Student"
    />
  );
};

export default CreateStudentModal;
