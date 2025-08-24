import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Alert,
  Tooltip,
  Badge,
  Drawer,
  Grid,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  TeamOutlined,
  DollarOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useGetStudentByIdQuery,
  useGetStudentGroupsQuery,
  useUpdateStudentMutation,
  useUpdateStudentWithGroupMutation,
} from "@/shared/api/studentApi";
import { useGetGroupsQuery } from "@/shared/api/groupApi";
import {
  useGetStudentPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from "@/shared/api/paymentApi";
import type { Group, Payment } from "@/shared/types/models";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

const Student: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const studentId = parseInt(id || "0");

  // State для редактирования информации о студенте
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  // State для модальных окон
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // State для поиска
  const [groupSearchText, setGroupSearchText] = useState("");
  const [paymentSearchText, setPaymentSearchText] = useState("");

  // Forms
  const [studentForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  // API hooks
  const {
    data: student,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useGetStudentByIdQuery(studentId, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: groups,
    isLoading: isLoadingGroups,
    refetch: refetchGroups,
  } = useGetStudentGroupsQuery(studentId, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });

  const { data: allGroups, isLoading: isLoadingAllGroups } = useGetGroupsQuery(
    undefined,
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    data: payments,
    isLoading: isLoadingPayments,
    refetch: refetchPayments,
  } = useGetStudentPaymentsQuery(studentId, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });

  const [updateStudent] = useUpdateStudentMutation();
  const [updateStudentWithGroup] = useUpdateStudentWithGroupMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();

  // Инициализация формы при загрузке данных студента
  useEffect(() => {
    if (student) {
      studentForm.setFieldsValue({
        fullname: student.fullname,
        phone_number: student.phone_number,
        payment_due: student.payment_due,
        address: student.address,
      });
    }
  }, [student, studentForm]);

  // Обработчики для редактирования студента
  const handleEditStudent = () => {
    setIsEditingStudent(true);
  };

  const handleSaveStudent = async () => {
    try {
      const values = await studentForm.validateFields();
      await updateStudent({
        ...student!,
        ...values,
      }).unwrap();
      message.success("Student information updated successfully");
      setIsEditingStudent(false);
    } catch (error) {
      message.error("Failed to update student information");
    }
  };

  const handleCancelEditStudent = () => {
    setIsEditingStudent(false);
    if (student) {
      studentForm.setFieldsValue({
        fullname: student.fullname,
        phone_number: student.phone_number,
        payment_due: student.payment_due,
        address: student.address,
      });
    }
  };

  // Обработчики для групп
  const handleEditGroups = () => {
    const currentGroupIds = groups?.map((g) => g.id) || [];
    groupForm.setFieldsValue({ groupIds: currentGroupIds });
    setIsGroupModalVisible(true);
  };

  const handleSaveGroups = async () => {
    try {
      const values = await groupForm.validateFields();
      await updateStudentWithGroup({
        student: student!,
        groupIds: values.groupIds || [],
      }).unwrap();
      message.success("Student groups updated successfully");
      setIsGroupModalVisible(false);
      refetchGroups();
    } catch (error) {
      message.error("Failed to update student groups");
    }
  };

  // Обработчики для платежей
  const handleAddPayment = () => {
    setEditingPayment(null);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      date: dayjs(),
      payment_period: dayjs().format("YYYY-MM"),
      payment_type: "monthly",
    });
    setIsPaymentModalVisible(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    paymentForm.setFieldsValue({
      ...payment,
      date: dayjs(payment.date),
    });
    setIsPaymentModalVisible(true);
  };

  const handleSavePayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      const paymentData = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        student_id: studentId,
      };

      if (editingPayment) {
        await updatePayment({
          ...editingPayment,
          ...paymentData,
        }).unwrap();
        message.success("Payment updated successfully");
      } else {
        await createPayment(paymentData).unwrap();
        message.success("Payment created successfully");
      }

      setIsPaymentModalVisible(false);
      refetchPayments();
    } catch (error) {
      message.error(
        `Failed to ${editingPayment ? "update" : "create"} payment`
      );
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await deletePayment(paymentId).unwrap();
      message.success("Payment deleted successfully");
      refetchPayments();
    } catch (error) {
      message.error("Failed to delete payment");
    }
  };

  // Фильтрация групп
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((group: Group) =>
      group.title.toLowerCase().includes(groupSearchText.toLowerCase())
    );
  }, [groups, groupSearchText]);

  // Фильтрация платежей
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    return payments.filter((payment) => {
      const searchLower = paymentSearchText.toLowerCase();
      return (
        payment.payment_period.toLowerCase().includes(searchLower) ||
        payment.payment_type.toLowerCase().includes(searchLower) ||
        payment.notes?.toLowerCase().includes(searchLower) ||
        dayjs(payment.date).format("DD MMM YYYY").toLowerCase().includes(searchLower)
      );
    });
  }, [payments, paymentSearchText]);

  // Колонки для таблицы групп
  const groupColumns: ColumnsType<Group> = [
    {
      title: "Group Name",
      dataIndex: "title",
      key: "title",
      render: (title: string) => (
        <Space>
          <TeamOutlined />
          <Text strong>{title}</Text>
        </Space>
      ),
    },
    {
      title: "Course Price",
      dataIndex: "course_price",
      key: "course_price",
      align: "right",
      render: (price: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {new Intl.NumberFormat("uz", {
            style: "currency",
            currency: "sum",
            minimumFractionDigits: 0,
          }).format(price)}
        </Text>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => (
        <Text type="secondary">{dayjs(date).format("DD MMM YYYY")}</Text>
      ),
    },
  ];

  // Колонки для таблицы платежей
  const paymentColumns: ColumnsType<Payment> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: screens.xs ? 100 : 120,
      render: (date: string) => (
        <Space size="small">
          <CalendarOutlined />
          <Text>{dayjs(date).format("DD MMM YYYY")}</Text>
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: screens.xs ? 100 : 120,
      align: "right",
      render: (amount: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {new Intl.NumberFormat("uz", {
            style: "currency",
            currency: "sum",
            minimumFractionDigits: 0,
          }).format(amount)}
        </Text>
      ),
    },
    {
      title: "Course Price",
      dataIndex: "course_price_at_payment",
      key: "course_price_at_payment",
      width: screens.xs ? 100 : 120,
      align: "right",
      responsive: ["md"],
      render: (price: number) => (
        <Text type="secondary">
          {new Intl.NumberFormat("uz", {
            style: "currency",
            currency: "sum",
            minimumFractionDigits: 0,
          }).format(price)}
        </Text>
      ),
    },
    {
      title: "Period",
      dataIndex: "payment_period",
      key: "payment_period",
      width: screens.xs ? 80 : 100,
      responsive: ["sm"],
      render: (period: string) => <Tag color="blue">{period}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "payment_type",
      key: "payment_type",
      width: screens.xs ? 70 : 90,
      responsive: ["lg"],
      render: (type: string) => <Tag color="green">{type}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record: Payment) => (
        <Space>
          <Tooltip title="Edit payment">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPayment(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete payment"
            description="Are you sure you want to delete this payment?"
            onConfirm={() => handleDeletePayment(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete payment">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!studentId || studentId === 0) {
    return (
      <Alert
        message="Invalid Student ID"
        description="Please provide a valid student ID."
        type="error"
        showIcon
      />
    );
  }

  if (studentError) {
    return (
      <Alert
        message="Error Loading Student"
        description="Unable to load student data. Please try again."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate("/students")}>
            Back to Students
          </Button>
        }
      />
    );
  }

  if (isLoadingStudent) {
    return <div>Loading student data...</div>;
  }

  if (!student) {
    return (
      <Alert
        message="Student Not Found"
        description="The requested student could not be found."
        type="warning"
        showIcon
        action={
          <Button onClick={() => navigate("/students")}>
            Back to Students
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <UserOutlined style={{ marginRight: 8 }} />
            Student Details
          </Title>
        </Col>
        <Col>
          <Button onClick={() => navigate("/students")}>
            Back to Students
          </Button>
        </Col>
      </Row>

      {/* Student Information Card */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            title={
              <Space wrap>
                <UserOutlined />
                <Title level={4} style={{ margin: 0 }}>
                  {student?.fullname || "Student"}
                </Title>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEditStudent}
                size={screens.xs ? "small" : "middle"}
              >
                {screens.xs ? "Edit" : "Edit Student"}
              </Button>
            }
          >
            <Form form={studentForm} layout="vertical">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Space direction={screens.xs ? "vertical" : "horizontal"} size="small">
                    <PhoneOutlined />
                    <Text strong>Phone:</Text>
                    <Text copyable>{student?.phone_number || "N/A"}</Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Space direction={screens.xs ? "vertical" : "horizontal"} size="small">
                    <CalendarOutlined />
                    <Text strong>Payment Due:</Text>
                    <Text>{student?.payment_due ? `Day ${student.payment_due}` : "N/A"}</Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Space direction={screens.xs ? "vertical" : "horizontal"} size="small">
                    <Text strong>Address:</Text>
                    <Text>{student?.address || "N/A"}</Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Space direction={screens.xs ? "vertical" : "horizontal"} size="small">
                    <Text strong>Created:</Text>
                    <Text>
                      {student?.created_at
                        ? new Date(student.created_at).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </Space>
                </Col>
              </Row>
              {isEditingStudent && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Full Name"
                      name="fullname"
                      rules={[{ required: true, message: "Please enter full name" }]}
                    >
                      <Input prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Phone Number"
                      name="phone_number"
                      rules={[
                        { required: true, message: "Please enter phone number" },
                      ]}
                    >
                      <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      label="Payment Due Day"
                      name="payment_due"
                      rules={[
                        { required: true, message: "Please enter payment due day" },
                        {
                          type: "number",
                          min: 1,
                          max: 31,
                          message: "Day must be between 1-31",
                        },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={31}
                        style={{ width: "100%" }}
                        addonAfter="day of month"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Address" name="address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveStudent}
                    >
                      Save
                    </Button>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={handleCancelEditStudent}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Groups and Payments */}
      <Row gutter={[24, 24]}>
        {/* Groups Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space wrap>
                <TeamOutlined />
                <Text>Groups</Text>
                <Badge count={groups?.length || 0} />
              </Space>
            }
            extra={
              <Space direction={screens.md ? "horizontal" : "vertical"} size="small">
                <Search
                  placeholder="Search groups..."
                  allowClear
                  value={groupSearchText}
                  onChange={(e) => setGroupSearchText(e.target.value)}
                  style={{ width: screens.xs ? "100%" : 200 }}
                  size={screens.xs ? "small" : "middle"}
                />
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEditGroups}
                  loading={isLoadingAllGroups}
                  size={screens.xs ? "small" : "middle"}
                  block={screens.xs}
                >
                  {screens.xs ? "Edit" : "Edit Groups"}
                </Button>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Table
              columns={groupColumns}
              dataSource={filteredGroups}
              rowKey="id"
              loading={isLoadingGroups}
              pagination={false}
              size={screens.xs ? "small" : "middle"}
              scroll={{ x: screens.xs ? 400 : undefined }}
              locale={{
                emptyText: groupSearchText ? "No groups found" : "No groups assigned",
              }}
            />
          </Card>
        </Col>

        {/* Payments Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space wrap>
                <DollarOutlined />
                <Text>Payments</Text>
                <Badge count={payments?.length || 0} />
              </Space>
            }
            extra={
              <Space direction={screens.md ? "horizontal" : "vertical"} size="small">
                <Search
                  placeholder="Search payments..."
                  allowClear
                  value={paymentSearchText}
                  onChange={(e) => setPaymentSearchText(e.target.value)}
                  style={{ width: screens.xs ? "100%" : 200 }}
                  size={screens.xs ? "small" : "middle"}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddPayment}
                  size={screens.xs ? "small" : "middle"}
                  block={screens.xs}
                >
                  {screens.xs ? "Add" : "Add Payment"}
                </Button>
              </Space>
            }
          >
            <Table
              columns={paymentColumns}
              dataSource={filteredPayments}
              rowKey="id"
              loading={isLoadingPayments}
              pagination={{
                pageSize: screens.xs ? 3 : 5,
                size: "small",
                showSizeChanger: !screens.xs,
                showQuickJumper: !screens.xs,
              }}
              size={screens.xs ? "small" : "middle"}
              scroll={{ x: screens.xs ? 500 : undefined }}
              locale={{
                emptyText: paymentSearchText ? "No payments found" : "No payments found",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Groups Modal */}
      {screens.xs ? (
        <Drawer
          title="Edit Student Groups"
          open={isGroupModalVisible}
          onClose={() => setIsGroupModalVisible(false)}
          placement="bottom"
          height="80%"
          extra={
            <Space>
              <Button onClick={() => setIsGroupModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSaveGroups}>
                Save
              </Button>
            </Space>
          }
        >
          <Form form={groupForm} layout="vertical">
            <Form.Item
              label="Select Groups"
              name="groupIds"
              help="Select all groups this student should be enrolled in"
            >
              <Select
                mode="multiple"
                placeholder="Select groups"
                loading={isLoadingAllGroups}
                optionFilterProp="children"
                size="large"
              >
                {allGroups?.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.title} -{" "}
                    {new Intl.NumberFormat("uz", {
                      style: "currency",
                      currency: "sum",
                      minimumFractionDigits: 0,
                    }).format(group.course_price)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title="Edit Student Groups"
          open={isGroupModalVisible}
          onOk={handleSaveGroups}
          onCancel={() => setIsGroupModalVisible(false)}
          width={Math.min(600, window.innerWidth * 0.9)}
        >
          <Form form={groupForm} layout="vertical">
            <Form.Item
              label="Select Groups"
              name="groupIds"
              help="Select all groups this student should be enrolled in"
            >
              <Select
                mode="multiple"
                placeholder="Select groups"
                loading={isLoadingAllGroups}
                optionFilterProp="children"
              >
                {allGroups?.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.title} -{" "}
                    {new Intl.NumberFormat("uz", {
                      style: "currency",
                      currency: "sum",
                      minimumFractionDigits: 0,
                    }).format(group.course_price)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Payment Modal */}
      {screens.xs ? (
        <Drawer
          title={editingPayment ? "Edit Payment" : "Add New Payment"}
          open={isPaymentModalVisible}
          onClose={() => setIsPaymentModalVisible(false)}
          placement="bottom"
          height="80%"
          extra={
            <Space>
              <Button onClick={() => setIsPaymentModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={handleSavePayment}>
                {editingPayment ? "Update" : "Create"}
              </Button>
            </Space>
          }
        >
          <Form form={paymentForm} layout="vertical">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Amount"
                  name="amount"
                  rules={[{ required: true, message: "Please enter amount" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    size="large"
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Group"
                  name="group_id"
                  rules={[{ required: true, message: "Please select group" }]}
                >
                  <Select placeholder="Select group" size="large">
                    {groups?.map((group) => (
                      <Option key={group.id} value={group.id}>
                        {group.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Notes" name="notes">
                  <Input.TextArea
                    placeholder="Optional notes"
                    rows={3}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Drawer>
      ) : (
        <Modal
          title={editingPayment ? "Edit Payment" : "Add New Payment"}
          open={isPaymentModalVisible}
          onOk={handleSavePayment}
          onCancel={() => setIsPaymentModalVisible(false)}
          width={Math.min(600, window.innerWidth * 0.9)}
        >
          <Form form={paymentForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Amount"
                  name="amount"
                  rules={[{ required: true, message: "Please enter amount" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Group"
                  name="group_id"
                  rules={[{ required: true, message: "Please select group" }]}
                >
                  <Select placeholder="Select group">
                    {groups?.map((group) => (
                      <Option key={group.id} value={group.id}>
                        {group.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Payment Period"
                  name="payment_period"
                  rules={[
                    { required: true, message: "Please select payment period" },
                  ]}
                >
                  <Select placeholder="Select payment period">
                    <Option value="monthly">Monthly Payment</Option>
                    <Option value="makeup">Makeup Payment</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Notes" name="notes">
                  <Input.TextArea rows={3} placeholder="Optional notes..." />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Student;
