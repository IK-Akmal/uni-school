import { Button, Drawer, Form, Input, InputNumber, Select } from "antd";

import type { FieldType, GroupFormProps } from "./GroupForm.types";

export const GroupForm = ({
  form,
  open,
  title,
  onClose,
  onFinish,
  isLoading,
  buttonLabel,
  students = [],
}: GroupFormProps) => {
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
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter the group title" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Course Price"
          name="course_price"
          rules={[
            { required: true, message: "Please enter the course price" },
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

        <Form.Item<FieldType> label="Students" name="studentIds">
          <Select
            placeholder="Select students"
            mode="multiple"
            allowClear
            loading={isLoading}
            optionFilterProp="children"
            showSearch
            style={{ width: "100%" }}
          >
            {students?.map((student) => (
              <Select.Option key={student.id} value={student.id}>
                {student.fullname}
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
