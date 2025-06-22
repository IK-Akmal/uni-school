import { useState, useMemo } from "react";
import {
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Typography,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import {
  useGetPaymentsQuery,
  useCreateStudentPaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentStudentsQuery,
} from "@/shared/api/paymentApi";
import { useGetStudentsQuery } from "@/shared/api/studentApi";
import { PaymentTable } from "@/widgets/payment-table";
import { EditPaymentModal } from "@/features/payment/edit-payment-modal";
import type { Payment } from "@/shared/types/models";

const { Title } = Typography;

const Payments = () => {
  const [createForm] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // RTK Query хуки
  const { data: payments = [], isLoading: isLoadingPayments } =
    useGetPaymentsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: students = [], isLoading: isLoadingStudents } =
    useGetStudentsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: paymentStudents = [] } = useGetPaymentStudentsQuery();
  const [createStudentPayment, { isLoading: isCreatingStudentPayment }] =
    useCreateStudentPaymentMutation();
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation();

  // Статус загрузки для создания платежа
  const isCreating = isCreatingStudentPayment;

  // Фильтрация платежей по поисковому запросу
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;

    const lowerQuery = searchQuery.toLowerCase();
    return payments.filter((payment) => {
      return (
        payment.date.toLowerCase().includes(lowerQuery) ||
        payment.amount.toString().includes(lowerQuery)
      );
    });
  }, [payments, searchQuery]);

  // Обработчики событий
  const handleCreatePayment = async (values: any) => {
    try {
      const paymentData = {
        date: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
      };

      // Создаем платеж и сразу привязываем его к студенту
      await createStudentPayment({
        studentId: values.studentId,
        payment: paymentData,
      });
      message.success("Payment successfully created and linked to student");

      createForm.resetFields();
    } catch (error) {
      console.error("Error creating payment:", error);
      message.error("Failed to create payment");
    }
  };

  const handleDeletePayment = async (id: number) => {
    try {
      await deletePayment(id);
      message.success("Payment successfully deleted");
    } catch (error) {
      console.error("Error deleting payment:", error);
      message.error("Failed to delete payment");
    }
  };

  // Обработчик редактирования платежа
  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsEditModalOpen(true);
  };

  // Получение ID студента, связанного с платежом
  const getStudentIdForPayment = (paymentId: number): number | null => {
    const relation = paymentStudents.find((ps) => ps.payment_id === paymentId);
    return relation ? relation.student_id : null;
  };

  return (
    <Flex vertical style={{ width: "100%", padding: "16px", display: "flex" }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={2}>Payments</Title>
        <Input.Search
          placeholder="Search payments"
          allowClear
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
        />
      </Flex>

      <Flex gap={16} style={{ marginBottom: 16 }}>
        <Card
          title="Create New Payment"
          style={{ width: "100%" }}
          variant="borderless"
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreatePayment}
            initialValues={{ date: dayjs(), amount: 0 }}
          >
            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: "Please select a date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: "Please enter an amount" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                precision={2}
                min={0}
                step={100}
              />
            </Form.Item>

            <Form.Item
              name="studentId"
              label="Student"
              tooltip="Select a student to link this payment"
              rules={[{ required: true, message: "Please select a student" }]}
            >
              <Select
                placeholder="Select student"
                loading={isLoadingStudents}
                disabled={isLoadingStudents}
                options={students.map((student) => ({
                  value: student.id,
                  label: student.fullname,
                }))}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={isCreating}
                block
              >
                Create Payment
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Flex>

      <Card title="Payment List" variant="borderless">
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 16 }}
        >
          <Typography.Title level={5} style={{ margin: 0 }}>
            {filteredPayments.length} payments found
          </Typography.Title>

          <Input
            placeholder="Search payments"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
            suffix={<SearchOutlined />}
            allowClear
          />
        </Flex>

        <PaymentTable
          payments={filteredPayments}
          isLoading={isLoadingPayments || isDeleting}
          onDeletePayment={handleDeletePayment}
          onEditPayment={handleEditPayment}
        />

        {/* Модальное окно редактирования платежа */}
        <EditPaymentModal
          payment={editingPayment}
          studentId={
            editingPayment ? getStudentIdForPayment(editingPayment.id) : null
          }
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPayment(null);
          }}
        />
      </Card>
    </Flex>
  );
};

export default Payments;
