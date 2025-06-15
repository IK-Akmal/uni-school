import { Drawer, Form, Input, Button, message, DatePicker } from "antd";
import { useEffect } from "react";

import { useCreateStudentPaymentMutation } from "@/shared/api/paymentApi";
import type {
  PaymentFormModalProps,
  FieldType,
} from "./PaymentFormModal.types";

const PaymentFormModal = ({
  open,
  onClose,
  onSuccess,
  studentId,
  title = "Add Payment",
}: PaymentFormModalProps) => {
  const [form] = Form.useForm<FieldType>();

  // Используем хук для создания платежа
  const [createStudentPayment, { isLoading }] =
    useCreateStudentPaymentMutation();

  // Сбрасываем форму при открытии
  useEffect(() => {
    if (open) {
      form.resetFields();
      // Устанавливаем текущую дату по умолчанию
      form.setFieldsValue({
        date: null, // DatePicker автоматически установит текущую дату
      });
    }
  }, [open, form]);

  const onFinish = async (values: FieldType) => {
    try {
      // Проверяем обязательные поля
      if (!values.amount || !values.date) {
        message.error("Please fill in all required fields");
        return;
      }

      // Создаем объект платежа
      const paymentData = {
        amount: Number(values.amount),
        date: values.date
          ? values.date.format("YYYY-MM-DD")
          : new Date().toISOString().split("T")[0],
      };

      // Создаем платеж для студента
      await createStudentPayment({
        studentId,
        payment: paymentData,
      });

      message.success("Payment successfully added");
      form.resetFields();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding payment:", error);
      message.error("Failed to add payment");
    }
  };

  return (
    <Drawer
      size="default"
      title={title}
      closable={{ "aria-label": "Close Button" }}
      onClose={onClose}
      open={open}
      width={400}
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
          label="Date"
          name="date"
          rules={[{ required: true, message: "Please select a date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item<FieldType>
          label="Amount"
          name="amount"
          rules={[
            {
              required: true,
              message: "Please enter the payment amount",
            },
          ]}
        >
          <Input type="number" min="0" step="0.01" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 0 }}>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Add Payment
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PaymentFormModal;
