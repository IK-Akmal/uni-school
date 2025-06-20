import React, { useEffect } from "react";
import { Modal, Form, DatePicker, InputNumber, Select, message } from "antd";
import { useUpdatePaymentMutation } from "@/shared/api/paymentApi";
import { useGetStudentsQuery } from "@/shared/api/studentApi";
import type { Payment } from "@/shared/types/models";
import dayjs from "dayjs";

interface EditPaymentModalProps {
  payment: Payment | null;
  studentId?: number | null;
  open: boolean;
  onClose: () => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  payment,
  studentId,
  open,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [updatePayment, { isLoading }] = useUpdatePaymentMutation();
  const { data: students = [], isLoading: isLoadingStudents } = useGetStudentsQuery();

  // Заполняем форму при открытии модального окна
  useEffect(() => {
    if (payment) {
      form.setFieldsValue({
        date: dayjs(payment.date),
        amount: payment.amount,
        studentId: studentId || undefined,
      });
    }
  }, [payment, studentId, form]);

  const handleSubmit = async (values: any) => {
    if (!payment) return;

    try {
      await updatePayment({
        id: payment.id,
        date: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
      });
      
      message.success("Payment successfully updated");
      onClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      message.error("Failed to update payment");
    }
  };

  return (
    <Modal
      title="Edit Payment"
      open={open}
      onCancel={onClose}
      okText="Update"
      cancelText="Cancel"
      confirmLoading={isLoading}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: "Please select date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: "Please enter amount" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            precision={2}
            min={0}
            placeholder="Enter amount"
          />
        </Form.Item>

        <Form.Item
          name="studentId"
          label="Student"
          tooltip="Student information (read-only)"
        >
          <Select
            placeholder="Select student"
            loading={isLoadingStudents}
            disabled={true} // Делаем поле только для чтения
            options={students.map(student => ({
              value: student.id,
              label: student.fullname
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
