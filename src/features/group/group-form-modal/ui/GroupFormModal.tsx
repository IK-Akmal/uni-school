import { Drawer, Form, Input, Button, message } from "antd";
import { useEffect } from "react";

import {
  useCreateGroupMutation,
  useUpdateGroupMutation,
} from "@/shared/api/groupApi";
import type { Group } from "@/shared/types/models";

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  group?: Group;
  mode: "create" | "edit";
}

type FieldType = {
  title: string;
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

  // Сбрасываем форму при открытии и заполняем данными при редактировании
  useEffect(() => {
    if (open) {
      form.resetFields();
      if (mode === "edit" && group) {
        form.setFieldsValue({
          title: group.title,
        });
      }
    }
  }, [open, form, group, mode]);

  const onFinish = async (values: FieldType) => {
    try {
      if (mode === "create") {
        await createGroup(values);
        message.success("Group created successfully");
      } else if (mode === "edit" && group) {
        await updateGroup({ id: group.id, ...values });
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
