import { Button, Drawer, Form, Input, Select } from "antd";

import type { FieldType, StudentFormProps } from "./StudentForm.types";

export const StudentForm = ({
  form,
  open,
  title,
  groups,
  onClose,
  onFinish,
  isLoading,
  buttonLabel,
}: StudentFormProps) => {
  return (
    <Drawer
      width={450}
      open={open}
      title={title}
      size="default"
      onClose={onClose}
      closable={{ "aria-label": "Close Button" }}
    >
      <Form<FieldType>
        form={form}
        layout="vertical"
        autoComplete="off"
        onFinish={onFinish}
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 24 }}
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
            {buttonLabel}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};
