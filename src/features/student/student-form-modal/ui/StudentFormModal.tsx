import { Drawer, Form, Input, Select, Button, message } from "antd";
import { useEffect } from "react";

import {
  useCreateStudentWithGroupMutation,
  useUpdateStudentWithGroupMutation,
  useGetStudentGroupsQuery,
} from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";
import type {
  StudentFormModalProps,
  FieldType,
} from "./StudentFormModal.types";

const StudentFormModal = ({
  open,
  onClose,
  onSuccess,
  student,
  mode = "create",
  title,
}: StudentFormModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список групп
  const { data: groups } = useGetGroupsQuery();

  // Получаем группы студента при редактировании
  const { data: studentGroups } = useGetStudentGroupsQuery(student?.id || 0, {
    skip: !student?.id || mode !== "edit" || !open,
    refetchOnMountOrArgChange: true,
  });

  // Используем хуки для создания и редактирования
  const [createStudentWithGroup, { isLoading: isCreating }] =
    useCreateStudentWithGroupMutation();
  const [updateStudentWithGroup, { isLoading: isUpdating }] =
    useUpdateStudentWithGroupMutation();

  const isLoading = isCreating || isUpdating;

  // Заполняем форму данными студента при редактировании
  useEffect(() => {
    if (open) {
      form.resetFields();

      if (mode === "edit" && student) {
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
  }, [open, form, student, mode, studentGroups]);

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
        payment_due: values.payment_due || "0",
        address: values.address || "",
      };

      if (mode === "create") {
        // Создаем нового студента
        await createStudentWithGroup({
          student: studentData,
          groupIds: values.groupIds,
        });
        message.success("Student successfully created");
      } else if (mode === "edit" && student) {
        // Обновляем существующего студента и его связи с группами
        await updateStudentWithGroup({
          student: {
            id: student.id,
            ...studentData,
          },
          groupIds: values.groupIds,
        });
        message.success("Student successfully updated");
      }

      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error processing student:", error);
      message.error(
        mode === "create"
          ? "Failed to create student"
          : "Failed to update student"
      );
    }
  };

  const getTitle = () => {
    if (title) return title;
    return mode === "create" ? "Create New Student" : "Edit Student";
  };

  return (
    <Drawer
      size="default"
      title={getTitle()}
      closable={{ "aria-label": "Close Button" }}
      onClose={onClose}
      open={open}
      width={450}
    >
      <Form<FieldType>
        form={form}
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 24 }}
        onFinish={onFinish}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Full name"
          name="fullname"
          rules={[
            { required: true, message: "Please enter the student's full name" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Phone number"
          name="phone_number"
          rules={[
            {
              required: true,
              message: "Please enter the student's phone number",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Address"
          name="address"
          rules={[
            {
              max: 150,
              min: 0,
            },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 4 }} />
        </Form.Item>

        <Form.Item<FieldType>
          label="Payment Due"
          name="payment_due"
          initialValue="0"
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item<FieldType> label="Groups" name="groupIds">
          <Select
            placeholder="Select groups"
            allowClear
            loading={isLoading}
            mode="multiple"
          >
            {groups?.map((group) => (
              <Select.Option key={group.id} value={group.id}>
                {group.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 0 }}>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            {mode === "create" ? "Create Student" : "Update Student"}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default StudentFormModal;
