import { useState, useMemo } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Drawer,
  Modal,
  Grid,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DollarOutlined,
  CalendarOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  useGetPaymentsQuery,
  useCreateStudentPaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentStudentsQuery,
} from "@/shared/api/paymentApi";
import {
  useGetStudentsQuery,
  useGetStudentGroupsQuery,
} from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";
import { PaymentTable } from "@/widgets/payment-table";
import { EditPaymentModal } from "@/features/payment/edit-payment-modal";
import type { Payment } from "@/shared/types/models";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

const Payments: React.FC = () => {
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    null
  );
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const screens = useBreakpoint();

  // RTK Query хуки
  const { data: payments = [], isLoading: isLoadingPayments } =
    useGetPaymentsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: students = [], isLoading: isLoadingStudents } =
    useGetStudentsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: groups = [], isLoading: isLoadingGroups } = useGetGroupsQuery(
    undefined,
    { refetchOnMountOrArgChange: true }
  );
  const { data: studentGroups = [], isLoading: isLoadingStudentGroups } =
    useGetStudentGroupsQuery(selectedStudentId!, {
      skip: !selectedStudentId,
      refetchOnMountOrArgChange: true,
    });
  const { data: paymentStudents = [] } = useGetPaymentStudentsQuery();
  const [createStudentPayment, { isLoading: isCreatingStudentPayment }] =
    useCreateStudentPaymentMutation();
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation();

  // Статус загрузки для создания платежа
  const isCreating = isCreatingStudentPayment;

  // Расширенная фильтрация платежей
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((payment) => {
        const student = students.find((s) => {
          const relation = paymentStudents.find(
            (ps) => ps.payment_id === payment.id
          );
          return relation && relation.student_id === s.id;
        });
        return (
          payment.date.toLowerCase().includes(lowerQuery) ||
          payment.amount.toString().includes(lowerQuery) ||
          payment.payment_type.toLowerCase().includes(lowerQuery) ||
          payment.payment_period.toLowerCase().includes(lowerQuery) ||
          payment.notes?.toLowerCase().includes(lowerQuery) ||
          student?.fullname.toLowerCase().includes(lowerQuery)
        );
      });
    }

    // Фильтр по дате
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter((payment) => {
        const paymentDate = dayjs(payment.date);
        return (
          paymentDate.isAfter(startDate.startOf("day")) &&
          paymentDate.isBefore(endDate.endOf("day"))
        );
      });
    }

    // Фильтр по типу платежа
    if (selectedPaymentType) {
      filtered = filtered.filter(
        (payment) => payment.payment_type === selectedPaymentType
      );
    }

    return filtered;
  }, [
    payments,
    searchQuery,
    dateRange,
    selectedPaymentType,
    students,
    paymentStudents,
  ]);

  // Статистика платежей
  const paymentStats = useMemo(() => {
    const totalAmount = filteredPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const avgAmount =
      filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;
    const todayPayments = filteredPayments.filter((p) =>
      dayjs(p.date).isSame(dayjs(), "day")
    );
    const thisMonthPayments = filteredPayments.filter((p) =>
      dayjs(p.date).isSame(dayjs(), "month")
    );

    return {
      total: totalAmount,
      average: avgAmount,
      count: filteredPayments.length,
      todayCount: todayPayments.length,
      todayAmount: todayPayments.reduce((sum, p) => sum + p.amount, 0),
      monthCount: thisMonthPayments.length,
      monthAmount: thisMonthPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [filteredPayments]);

  // Обработчик изменения выбранного студента
  const handleStudentChange = (studentId: number) => {
    setSelectedStudentId(studentId);
    // Сбрасываем выбор группы при смене студента
    form.setFieldsValue({ groupId: null });
  };

  // Определяем какие группы показывать
  const availableGroups = selectedStudentId ? studentGroups : groups;

  // Обработчики событий
  const handleCreatePayment = async (values: any) => {
    try {
      const paymentData = {
        date: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
        group_id: values.groupId,
        student_id: values.studentId,
        course_price_at_payment: values.coursePriceAtPayment,
        payment_period: values.paymentPeriod,
        payment_type: values.paymentType,
        notes: values.notes || null,
      };

      // Создаем платеж с полными данными
      await createStudentPayment({
        studentId: values.studentId,
        payment: paymentData,
      }).unwrap();

      message.success("Payment successfully created and linked to student");
      form.resetFields();
      setSelectedStudentId(null);
      setIsCreateModalOpen(false);
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

  // Очистка всех фильтров
  const clearAllFilters = () => {
    setSearchQuery("");
    setDateRange(null);
    setSelectedPaymentType(null);
  };

  // Обработчик закрытия модального окна создания платежа
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedStudentId(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: screens.xs ? "8px" : "16px" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <DollarOutlined style={{ marginRight: 8 }} />
            Payments
          </Title>
        </Col>
        <Col>
          <Space wrap>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              type={isFiltersVisible ? "primary" : "default"}
              size={screens.xs ? "small" : "middle"}
            >
              {screens.xs ? "Filters" : "Show Filters"}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
              size={screens.xs ? "small" : "middle"}
            >
              {screens.xs ? "Add" : "Add Payment"}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Amount"
              value={paymentStats.total}
              precision={0}
              valueStyle={{
                color: "#3f8600",
                fontSize: screens.xs ? "16px" : "20px",
              }}
              prefix={<DollarOutlined />}
              suffix="UZS"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Payments"
              value={paymentStats.count}
              valueStyle={{
                color: "#1890ff",
                fontSize: screens.xs ? "16px" : "20px",
              }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Today"
              value={paymentStats.todayAmount}
              precision={0}
              valueStyle={{
                color: "#722ed1",
                fontSize: screens.xs ? "16px" : "20px",
              }}
              prefix={<DollarOutlined />}
              suffix="UZS"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="This Month"
              value={paymentStats.monthAmount}
              precision={0}
              valueStyle={{
                color: "#eb2f96",
                fontSize: screens.xs ? "16px" : "20px",
              }}
              prefix={<DollarOutlined />}
              suffix="UZS"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Panel */}
      {isFiltersVisible && (
        <Card style={{ marginBottom: 24 }} size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size={screens.xs ? "small" : "middle"}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  } else {
                    setDateRange(null);
                  }
                }}
                style={{ width: "100%" }}
                placeholder={["Start Date", "End Date"]}
                size={screens.xs ? "small" : "middle"}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space.Compact style={{ width: "100%" }}>
                <Select
                  placeholder="Payment Type"
                  value={selectedPaymentType}
                  onChange={setSelectedPaymentType}
                  allowClear
                  style={{ width: "80%" }}
                  size={screens.xs ? "small" : "middle"}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "transfer", label: "Bank Transfer" },
                    { value: "online", label: "Online Payment" },
                  ]}
                />
                <Button
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  size={screens.xs ? "small" : "middle"}
                  style={{ width: "20%" }}
                  title="Clear all filters"
                />
              </Space.Compact>
            </Col>
          </Row>
        </Card>
      )}

      {/* Payment List */}
      <Card
        title={
          <Space>
            <Text strong>Payment List</Text>
            <Tag color="blue">{filteredPayments.length} payments</Tag>
          </Space>
        }
        extra={
          !screens.xs && (
            <Input
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
              size="small"
            />
          )
        }
      >
        <PaymentTable
          payments={filteredPayments}
          isLoading={isLoadingPayments || isDeleting}
          onDeletePayment={handleDeletePayment}
          onEditPayment={handleEditPayment}
        />
      </Card>

      {/* Create Payment Modal/Drawer */}
      {screens.xs ? (
        <Drawer
          title="Create New Payment"
          open={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          placement="bottom"
          height="90%"
          extra={
            <Space>
              <Button onClick={handleCloseCreateModal}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={isCreating}
              >
                Create
              </Button>
            </Space>
          }
        >
          <Form
            form={form}
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
                onChange={handleStudentChange}
                options={students.map((student) => ({
                  value: student.id,
                  label: student.fullname,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="groupId"
              label="Group"
              rules={[{ required: true, message: "Please select a group" }]}
            >
              <Select
                placeholder={
                  selectedStudentId
                    ? "Select group from student's groups"
                    : "Select student first"
                }
                loading={isLoadingGroups || isLoadingStudentGroups}
                disabled={
                  isLoadingGroups ||
                  isLoadingStudentGroups ||
                  !selectedStudentId
                }
                options={availableGroups.map((group) => ({
                  value: group.id,
                  label: group.title,
                }))}
                notFoundContent={
                  selectedStudentId
                    ? "No groups found for this student"
                    : "Please select a student first"
                }
              />
            </Form.Item>

            <Form.Item
              name="coursePriceAtPayment"
              label="Course Price at Payment"
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

            <Form.Item
              name="paymentPeriod"
              label="Payment Period"
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
            >
              <Input 
                placeholder="e.g., 2024-01" 
                maxLength={7}
                onInput={(e) => {
                  // Автоматическое добавление дефиса после года
                  const target = e.target as HTMLInputElement;
                  let value = target.value.replace(/[^\d-]/g, '');
                  if (value.length === 4 && !value.includes('-')) {
                    value += '-';
                  }
                  target.value = value;
                }}
              />
            </Form.Item>

            <Form.Item
              name="paymentType"
              label="Payment Type"
              rules={[
                { required: true, message: "Please select payment type" },
              ]}
            >
              <Select
                placeholder="Select payment type"
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Card" },
                  { value: "transfer", label: "Bank Transfer" },
                  { value: "online", label: "Online Payment" },
                ]}
              />
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea
                rows={2}
                placeholder="Optional notes about the payment"
              />
            </Form.Item>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title="Create New Payment"
          open={isCreateModalOpen}
          onCancel={handleCloseCreateModal}
          footer={[
            <Button key="cancel" onClick={handleCloseCreateModal}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={() => form.submit()}
              loading={isCreating}
            >
              Create Payment
            </Button>,
          ]}
          width={600}
        >
          <Form
            form={form}
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
                onChange={handleStudentChange}
                options={students.map((student) => ({
                  value: student.id,
                  label: student.fullname,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="groupId"
              label="Group"
              rules={[{ required: true, message: "Please select a group" }]}
            >
              <Select
                placeholder={
                  selectedStudentId
                    ? "Select group from student's groups"
                    : "Select student first"
                }
                loading={isLoadingGroups || isLoadingStudentGroups}
                disabled={
                  isLoadingGroups ||
                  isLoadingStudentGroups ||
                  !selectedStudentId
                }
                options={availableGroups.map((group) => ({
                  value: group.id,
                  label: group.title,
                }))}
                notFoundContent={
                  selectedStudentId
                    ? "No groups found for this student"
                    : "Please select a student first"
                }
              />
            </Form.Item>

            <Form.Item
              name="coursePriceAtPayment"
              label="Course Price at Payment"
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

            <Form.Item
              name="paymentPeriod"
              label="Payment Period"
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
            >
              <Input 
                placeholder="e.g., 2024-01" 
                maxLength={7}
                onInput={(e) => {
                  // Автоматическое добавление дефиса после года
                  const target = e.target as HTMLInputElement;
                  let value = target.value.replace(/[^\d-]/g, '');
                  if (value.length === 4 && !value.includes('-')) {
                    value += '-';
                  }
                  target.value = value;
                }}
              />
            </Form.Item>

            <Form.Item
              name="paymentType"
              label="Payment Type"
              rules={[
                { required: true, message: "Please select payment type" },
              ]}
            >
              <Select
                placeholder="Select payment type"
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Card" },
                  { value: "transfer", label: "Bank Transfer" },
                  { value: "online", label: "Online Payment" },
                ]}
              />
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea
                rows={2}
                placeholder="Optional notes about the payment"
              />
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Edit Payment Modal */}
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
    </div>
  );
};

export default Payments;
