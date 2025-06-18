import { useEffect } from "react";
import { Form, message } from "antd";

import {
  useUpdateGroupWithStudentsMutation,
  useGetGroupStudentsQuery,
} from "@/shared/api/groupApi";
import { useGetStudentsQuery } from "@/shared/api/studentApi";
import { GroupForm } from "@/shared/components/group-form";

import type { EditGroupModalProps } from "./EditGroupModal.types";
import type { FieldType } from "@/shared/components/group-form";

const EditGroupModal = ({
  open,
  group,
  onClose,
  onSuccess,
}: EditGroupModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список всех студентов
  const { data: students, isLoading: isLoadingStudents } = useGetStudentsQuery(
    undefined,
    {
      skip: !open,
      refetchOnMountOrArgChange: true,
    }
  );

  // Получаем список студентов в группе (только для режима редактирования)
  const {
    data: groupStudents,
    isLoading: isLoadingGroupStudents,
    refetch,
  } = useGetGroupStudentsQuery(group?.id || 0, {
    skip: !open || !group,
    refetchOnMountOrArgChange: true,
  });

  // Используем мутацию для обновления группы со студентами
  const [updateGroupWithStudents, { isLoading: isUpdating }] = 
    useUpdateGroupWithStudentsMutation();

  const isLoading =
    isUpdating ||
    isLoadingStudents ||
    isLoadingGroupStudents;

  // Заполняем форму данными группы при редактировании
  useEffect(() => {
    if (open && group) {
      form.resetFields();

      // Заполняем форму данными группы
      form.setFieldsValue({
        title: group.title,
      });
    }
  }, [open, form, group]);

  // Заполняем список выбранных студентов при редактировании группы
  useEffect(() => {
    if (open && groupStudents && groupStudents.length > 0) {
      const studentIds = groupStudents.map((student) => student.id);
      form.setFieldsValue({
        studentIds: studentIds,
      });
    }
  }, [groupStudents, form, open]);

  const onFinish = async (values: FieldType) => {
    try {
      if (!group) {
        message.error("Group not found");
        return;
      }

      // Проверяем обязательные поля
      if (!values.title) {
        message.error("Please enter the group title");
        return;
      }

      // Обновляем группу и связи со студентами в одной транзакции
      await updateGroupWithStudents({
        group: {
          id: group.id,
          title: values.title,
        },
        studentIds: values.studentIds,
      });

      message.success("Group successfully updated");

      if (onSuccess) onSuccess();
      onClose();
      refetch();
    } catch (error) {
      console.error("Error updating group:", error);
      message.error("Failed to update group");
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
      title="Edit Group"
      buttonLabel="Update Group"
    />
  );
};

export default EditGroupModal;
