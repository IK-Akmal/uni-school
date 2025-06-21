import { useEffect } from "react";
import { Form, message } from "antd";

import {
  useUpdateStudentWithGroupMutation,
  useGetStudentGroupsQuery,
} from "@/shared/api/studentApi";
import { type FieldType, StudentForm } from "@/shared/components/student-form";
import { useGetGroupsQuery } from "@/shared/api/groupApi";

import type { StudentFormModalProps } from "./EditStudentModal.types";

const EditStudentModal = ({
  open,
  student,
  onClose,
  onSuccess,
}: StudentFormModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список групп
  const { data: groups } = useGetGroupsQuery();

  // Получаем группы студента при редактировании
  const { data: studentGroups } = useGetStudentGroupsQuery(student?.id || 0, {
    skip: !student?.id || !open,
    refetchOnMountOrArgChange: true,
  });

  // Используем хуки для создания и редактирования
  const [updateStudentWithGroup, { isLoading: isUpdating }] =
    useUpdateStudentWithGroupMutation();

  const isLoading = isUpdating;

  // Заполняем форму данными студента при редактировании
  useEffect(() => {
    if (open) {
      form.resetFields();

      if (student) {
        // Заполняем форму данными студента
        form.setFieldsValue({
          fullname: student.fullname,
          phone_number: student.phone_number,
          payment_due: student.payment_due,
          address: student.address || "",
          groupIds: studentGroups?.map(({ id }) => id) || [],
        });
      }
    }
  }, [open, form, student, studentGroups]);

  const onFinish = async (values: FieldType) => {
    try {
      // Проверяем обязательные поля
      if (!values.fullname || !values.phone_number) {
        message.error("Please fill in all required fields");
        return;
      }

      // Создаем объект студента
      const studentData = {
        fullname: values.fullname,
        phone_number: values.phone_number,
        payment_due: typeof values.payment_due === 'string' ? parseFloat(values.payment_due) || 0 : values.payment_due || 0,
        address: values.address || "",
      };

      if (student) {
        // Обновляем существующего студента и его связи с группами
        await updateStudentWithGroup({
          student: {
            id: student.id,
            created_at: student.created_at,
            ...studentData,
          },
          groupIds: values.groupIds || [],
        });
        message.success("Student successfully updated");
      }

      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error processing student:", error);
      message.error("Failed to update student");
    }
  };

  return (
    <StudentForm
      open={open}
      form={form}
      onClose={onClose}
      title="Edit Student"
      onFinish={onFinish}
      groups={groups ?? []}
      isLoading={isLoading}
      buttonLabel={"Update Student"}
    />
  );
};

export default EditStudentModal;
