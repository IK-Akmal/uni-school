import { Drawer, Form, InputNumber, Button, message, DatePicker, Select, Input } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

import { useCreateStudentPaymentMutation } from "@/shared/api/paymentApi";
import { useGetStudentGroupsQuery } from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";
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

  // Используем хуки для получения данных
  const [createStudentPayment, { isLoading }] = useCreateStudentPaymentMutation();
  const { data: groups = [] } = useGetGroupsQuery();
  const { data: studentGroups = [] } = useGetStudentGroupsQuery(studentId, {
    skip: !studentId,
  });

  // Сбрасываем форму при открытии
  useEffect(() => {
    if (open) {
      form.resetFields();
      // Устанавливаем текущую дату по умолчанию
      form.setFieldsValue({
        date: dayjs(), // Устанавливаем текущую дату
      });
    }
  }, [open, form]);

  const onFinish = async (values: FieldType) => {
    try {
      // Проверяем обязательные поля
      if (!values.amount || !values.date || !values.groupId || !values.paymentType || !values.paymentPeriod) {
        message.error("Please fill in all required fields");
        return;
      }

      // Создаем объект платежа с обязательными полями
      const paymentData = {
        amount: Number(values.amount),
        date: values.date.format("YYYY-MM-DD"),
        payment_type: values.paymentType,
        payment_period: values.paymentPeriod,
        course_price_at_payment: Number(values.coursePriceAtPayment || values.amount),
        notes: values.notes || null,
        group_id: values.groupId,
        student_id: studentId,
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
      open={open}
      width={400}
      size="default"
      title={title}
      onClose={onClose}
      closable={{ "aria-label": "Close Button" }}
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
          <InputNumber 
            style={{ width: "100%" }}
            min={0} 
            step={0.01}
            precision={2}
            placeholder="Enter payment amount"
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Payment Type"
          name="paymentType"
          rules={[{ required: true, message: "Please select payment type" }]}
        >
          <Select placeholder="Select payment type">
            <Select.Option value="cash">Cash</Select.Option>
            <Select.Option value="card">Card</Select.Option>
            <Select.Option value="transfer">Transfer</Select.Option>
            <Select.Option value="online">Online</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item<FieldType>
          label="Payment Period"
          name="paymentPeriod"
          rules={[
            { required: true, message: "Please enter payment period" },
            {
              pattern: /^\d{4}-\d{2}$/,
              message: "Payment period must be in YYYY-MM format (e.g., 2024-01)"
            },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const [year, month] = value.split('-').map(Number);
                const currentYear = new Date().getFullYear();
                if (year < 2020 || year > currentYear + 5) {
                  return Promise.reject(new Error(`Year must be between 2020 and ${currentYear + 5}`));
                }
                if (month < 1 || month > 12) {
                  return Promise.reject(new Error('Month must be between 01 and 12'));
                }
                return Promise.resolve();
              }
            }
          ]}
          initialValue={dayjs().format("YYYY-MM")}
        >
          <Input 
            placeholder="e.g., 2024-01" 
            maxLength={7}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              let value = target.value.replace(/[^\d-]/g, '');
              if (value.length === 4 && !value.includes('-')) {
                value += '-';
              }
              target.value = value;
            }}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Group"
          name="groupId"
          rules={[{ required: true, message: "Please select a group" }]}
        >
          <Select 
            placeholder="Select group"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {studentGroups.map(sg => {
              const group = groups.find(g => g.id === sg.group_id);
              return group ? (
                <Select.Option key={group.id} value={group.id}>
                  {group.title}
                </Select.Option>
              ) : null;
            })}
          </Select>
        </Form.Item>

        <Form.Item<FieldType>
          label="Course Price at Payment"
          name="coursePriceAtPayment"
          rules={[{ required: true, message: "Please enter course price" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            precision={2}
            min={0}
            step={100}
            placeholder="Course price at time of payment"
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Notes"
          name="notes"
        >
          <Input.TextArea
            rows={3}
            placeholder="Additional notes about this payment"
          />
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
