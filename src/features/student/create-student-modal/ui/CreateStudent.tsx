import { Drawer, Form, Input, Select, Button, message } from "antd";
import { useEffect } from "react";

import { useCreateStudentWithGroupMutation } from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";
import type { CreateStudentModalProps, FieldType } from "./CreateStudent.types";

const CreateStudentModal = ({
  open,
  onClose,
  onSuccess,
}: CreateStudentModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Получаем список групп
  const { data: groups } = useGetGroupsQuery();

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
    <Drawer
      size="default"
      title="Create New Student"
      closable={{ "aria-label": "Close Button" }}
      onClose={onClose}
      open={open}
      width={500}
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
            Create Student
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CreateStudentModal;
