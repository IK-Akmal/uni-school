import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Descriptions,
  Space,
  Alert,
  Spin,
  message,
  Modal,
  Tag,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  useGetPaymentsQuery,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentStudentsQuery,
} from "@/shared/api/paymentApi";
import { useGetStudentsQuery } from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const paymentId = parseInt(id || "0");

  // RTK Query хуки
  const { data: payments = [], isLoading: isLoadingPayments } =
    useGetPaymentsQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: groups = [] } = useGetGroupsQuery();
  const { data: paymentStudents = [] } = useGetPaymentStudentsQuery();
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation();
  const [deletePayment, { isLoading: isDeleting }] = useDeletePaymentMutation();

  // Найти текущий платеж
  const currentPayment = payments.find((p) => p.id === paymentId);

  // Найти связанного студента
  const paymentStudentRelation = paymentStudents.find(
    (ps) => ps.payment_id === paymentId
  );
  const relatedStudent = students.find(
    (s) => s.id === paymentStudentRelation?.student_id
  );

  // Найти связанную группу
  const relatedGroup = groups.find((g) => g.id === currentPayment?.group_id);

  useEffect(() => {
    if (currentPayment) {
      form.setFieldsValue({
        date: dayjs(currentPayment.date),
        amount: currentPayment.amount,
        paymentType: currentPayment.payment_type,
        paymentPeriod: currentPayment.payment_period,
        coursePriceAtPayment: currentPayment.course_price_at_payment,
        notes: currentPayment.notes,
        groupId: currentPayment.group_id,
        studentId: paymentStudentRelation?.student_id,
      });
    }
  }, [currentPayment, paymentStudentRelation, form]);

  const handleSave = async (values: any) => {
    if (!currentPayment) return;

    try {
      await updatePayment({
        id: paymentId,
        date: values.date.format("YYYY-MM-DD"),
        amount: values.amount,
        payment_type: values.paymentType,
        payment_period: values.paymentPeriod,
        course_price_at_payment: values.coursePriceAtPayment,
        notes: values.notes || null,
        group_id: values.groupId,
        student_id: values.studentId,
        created_at: currentPayment.created_at,
      }).unwrap();

      message.success("Payment updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating payment:", error);
      message.error("Failed to update payment");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(paymentId).unwrap();
      message.success("Payment deleted successfully");
      navigate("/payments");
    } catch (error) {
      console.error("Error deleting payment:", error);
      message.error("Failed to delete payment");
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return "green";
      case "card":
        return "blue";
      case "transfer":
        return "purple";
      case "online":
        return "cyan";
      default:
        return "default";
    }
  };

  if (isLoadingPayments) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentPayment) {
    return (
      <Alert
        message="Payment Not Found"
        description="The requested payment could not be found."
        type="error"
        action={
          <Button onClick={() => navigate("/payments")}>
            Back to Payments
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Заголовок с навигацией */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/payments")}
            >
              Back to Payments
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Payment Details #{paymentId}
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            {!isEditing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                Edit Payment
              </Button>
            ) : (
              <Space>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={isUpdating}
                  onClick={() => form.submit()}
                >
                  Save Changes
                </Button>
              </Space>
            )}
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Основная информация о платеже */}
        <Col xs={24} lg={16}>
          <Card title="Payment Information" style={{ height: "100%" }}>
            {!isEditing ? (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Date">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(currentPayment.date).format("MMMM D, YYYY")}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Space>
                    <DollarOutlined />
                    <Text strong style={{ fontSize: "16px" }}>
                      ${currentPayment.amount.toFixed(2)}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Type">
                  <Tag color={getPaymentTypeColor(currentPayment.payment_type)}>
                    {currentPayment.payment_type.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Period">
                  {currentPayment.payment_period}
                </Descriptions.Item>
                <Descriptions.Item label="Course Price at Payment">
                  ${currentPayment.course_price_at_payment.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Notes">
                  {currentPayment.notes || (
                    <Text type="secondary">No notes</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Created">
                  {dayjs(currentPayment.created_at).format(
                    "MMMM D, YYYY HH:mm"
                  )}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="date"
                      label="Payment Date"
                      rules={[
                        {
                          required: true,
                          message: "Please select payment date",
                        },
                      ]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="amount"
                      label="Amount"
                      rules={[
                        { required: true, message: "Please enter amount" },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        precision={2}
                        min={0}
                        step={10}
                        addonBefore="$"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="paymentType"
                      label="Payment Type"
                      rules={[
                        {
                          required: true,
                          message: "Please select payment type",
                        },
                      ]}
                    >
                      <Select placeholder="Select payment type">
                        <Select.Option value="cash">Cash</Select.Option>
                        <Select.Option value="card">Card</Select.Option>
                        <Select.Option value="transfer">Transfer</Select.Option>
                        <Select.Option value="online">Online</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="paymentPeriod"
                      label="Payment Period"
                      rules={[
                        {
                          required: true,
                          message: "Please enter payment period",
                        },
                        {
                          pattern: /^\d{4}-\d{2}$/,
                          message:
                            "Payment period must be in YYYY-MM format (e.g., 2024-01)",
                        },
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            const [year, month] = value.split("-").map(Number);
                            const currentYear = new Date().getFullYear();
                            if (year < 2020 || year > currentYear + 5) {
                              return Promise.reject(
                                new Error(
                                  `Year must be between 2020 and ${
                                    currentYear + 5
                                  }`
                                )
                              );
                            }
                            if (month < 1 || month > 12) {
                              return Promise.reject(
                                new Error("Month must be between 01 and 12")
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input
                        placeholder="e.g., 2024-01"
                        maxLength={7}
                        onInput={(e) => {
                          // Автоматическое добавление дефиса после года
                          const target = e.target as HTMLInputElement;
                          let value = target.value.replace(/[^\d-]/g, "");
                          if (value.length === 4 && !value.includes("-")) {
                            value += "-";
                          }
                          target.value = value;
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="coursePriceAtPayment"
                      label="Course Price at Payment"
                      rules={[
                        {
                          required: true,
                          message: "Please enter course price",
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        precision={2}
                        min={0}
                        step={100}
                        addonBefore="$"
                        placeholder="Course price at time of payment"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="groupId"
                      label="Group"
                      rules={[
                        { required: true, message: "Please select group" },
                      ]}
                    >
                      <Select placeholder="Select group">
                        {groups.map((group) => (
                          <Select.Option key={group.id} value={group.id}>
                            {group.title}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="studentId"
                  label="Student"
                  rules={[{ required: true, message: "Please select student" }]}
                >
                  <Select
                    placeholder="Select student"
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.children || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {students.map((student) => (
                      <Select.Option key={student.id} value={student.id}>
                        {student.fullname}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="notes" label="Notes">
                  <TextArea
                    rows={3}
                    placeholder="Additional notes about this payment"
                  />
                </Form.Item>
              </Form>
            )}
          </Card>
        </Col>

        {/* Информация о студенте и группе */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Информация о студенте */}
            {relatedStudent && (
              <Card
                title={
                  <Space>
                    <UserOutlined />
                    Student Information
                  </Space>
                }
                size="small"
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Name">
                    <Text strong>{relatedStudent.fullname}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {relatedStudent.phone_number}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Due Day">
                    {relatedStudent.payment_due}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {relatedStudent.address || (
                      <Text type="secondary">Not specified</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
                <Divider />
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/student/${relatedStudent.id}`)}
                >
                  View Student Profile
                </Button>
              </Card>
            )}

            {/* Информация о группе */}
            {relatedGroup && (
              <Card
                title={
                  <Space>
                    <TeamOutlined />
                    Group Information
                  </Space>
                }
                size="small"
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Group Name">
                    <Text strong>{relatedGroup.title}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Course Price">
                    ${relatedGroup.course_price.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {dayjs(relatedGroup.created_at).format("MMMM D, YYYY")}
                  </Descriptions.Item>
                </Descriptions>
                <Divider />
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate("/groups")}
                >
                  View All Groups
                </Button>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        title="Delete Payment"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={isDeleting}
            onClick={handleDelete}
          >
            Delete Payment
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete this payment? This action cannot be
          undone.
        </p>
        <Alert
          message="Warning"
          description="Deleting this payment will permanently remove all associated data."
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default PaymentPage;
