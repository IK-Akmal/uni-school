import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Badge,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Alert,
  Tag,
  Tooltip,
  Modal,
  message,
} from "antd";
import {
  WarningOutlined,
  ReloadOutlined,
  SearchOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  useGetOverduePaymentStudentsQuery,
  useGetUpcomingPaymentStudentsQuery,
} from "@/shared/api/statisticsApi";
import type { OverduePaymentStudent } from "../shared/api/statisticsApi";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Интерфейс для фильтров
interface DebtorFilters {
  search: string;
  sortBy: "days_overdue" | "fullname" | "payment_due";
  sortOrder: "asc" | "desc";
  overdueCategory: "all" | "warning" | "critical" | "upcoming";
}

// Общий интерфейс для объединенной таблицы
interface CombinedPaymentStudent {
  id: number;
  fullname: string;
  payment_due: number;
  phone_number: string;
  days_overdue?: number;
  days_until_due?: number;
  status: "overdue" | "upcoming";
}

const Debtors: React.FC = () => {
  const [filters, setFilters] = useState<DebtorFilters>({
    search: "",
    sortBy: "days_overdue",
    sortOrder: "desc",
    overdueCategory: "all",
  });

  const {
    data: debtors,
    isLoading,
    error,
    refetch,
  } = useGetOverduePaymentStudentsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const {
    data: upcomingPayments,
    isLoading: isLoadingUpcoming,
    refetch: refetchUpcoming,
  } = useGetUpcomingPaymentStudentsQuery(
    { daysAhead: 3 },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  // Функция для объединения данных должников и upcoming payments
  const getCombinedStudents = (): CombinedPaymentStudent[] => {
    const combined: CombinedPaymentStudent[] = [];

    // Добавляем должников
    if (debtors) {
      debtors.forEach((debtor) => {
        combined.push({
          ...debtor,
          status: "overdue",
        });
      });
    }

    // Добавляем студентов с приближающимися платежами
    if (upcomingPayments) {
      upcomingPayments.forEach((upcoming) => {
        // Проверяем, что студент не дублируется в списке должников
        const existingDebtor = combined.find(
          (student) => student.id === upcoming.id
        );
        if (!existingDebtor) {
          combined.push({
            ...upcoming,
            status: "upcoming",
          });
        }
      });
    }

    return combined;
  };

  const combinedStudents = getCombinedStudents();

  // Функция для фильтрации и сортировки объединенных данных
  const getFilteredAndSortedStudents = () => {
    if (!combinedStudents) return [];

    let filtered = combinedStudents.filter((student) => {
      // Поиск по имени и телефону
      const searchMatch =
        student.fullname.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.phone_number.includes(filters.search);

      // Фильтр по категории
      let categoryMatch = true;
      if (filters.overdueCategory === "warning") {
        categoryMatch =
          student.status === "overdue" && (student.days_overdue || 0) <= 5;
      } else if (filters.overdueCategory === "critical") {
        categoryMatch =
          student.status === "overdue" && (student.days_overdue || 0) > 5;
      } else if (filters.overdueCategory === "upcoming") {
        categoryMatch = student.status === "upcoming";
      }

      return searchMatch && categoryMatch;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "days_overdue":
          // Для upcoming платежей используем отрицательное значение для правильной сортировки
          aValue =
            a.status === "overdue"
              ? a.days_overdue || 0
              : -(a.days_until_due || 0);
          bValue =
            b.status === "overdue"
              ? b.days_overdue || 0
              : -(b.days_until_due || 0);
          break;
        case "fullname":
          aValue = a.fullname.toLowerCase();
          bValue = b.fullname.toLowerCase();
          break;
        case "payment_due":
          aValue = a.payment_due;
          bValue = b.payment_due;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredStudents = getFilteredAndSortedStudents();

  // Статистика
  const stats = React.useMemo(() => {
    if (!debtors)
      return { total: 0, warning: 0, critical: 0, avgDaysOverdue: 0 };

    const warning = debtors.filter((d) => d.days_overdue <= 5).length;
    const critical = debtors.filter((d) => d.days_overdue > 5).length;
    const avgDaysOverdue =
      debtors.reduce((sum, d) => sum + d.days_overdue, 0) / debtors.length;

    return {
      total: debtors.length,
      warning,
      critical,
      avgDaysOverdue: Math.round(avgDaysOverdue * 10) / 10,
    };
  }, [debtors]);

  // Обработчик звонка студенту (пример функциональности)
  const handleCallStudent = (student: OverduePaymentStudent) => {
    Modal.confirm({
      title: "Call Student",
      content: `Do you want to call ${student.fullname} at ${student.phone_number}?`,
      icon: <PhoneOutlined />,
      onOk() {
        message.success(`Calling ${student.fullname}...`);
        // Здесь можно интегрировать с системой звонков
      },
    });
  };

  // Объединенные колонки для общей таблицы
  const combinedColumns: ColumnsType<CombinedPaymentStudent> = [
    {
      title: "Student Name",
      dataIndex: "fullname",
      key: "fullname",
      render: (name: string, record: CombinedPaymentStudent) => (
        <Space>
          <Text strong>{name}</Text>
          {record.status === "upcoming" && <Tag color="blue">Upcoming</Tag>}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string, record: CombinedPaymentStudent) => {
        if (status === "upcoming") {
          return (
            <Tag color="blue" icon={<CalendarOutlined />}>
              {record.days_until_due} days left
            </Tag>
          );
        } else {
          const days = record.days_overdue || 0;
          return (
            <Tag
              color={days <= 5 ? "gold" : days <= 10 ? "orange" : "red"}
              icon={<WarningOutlined />}
            >
              {days > 10 ? "Critical" : days > 5 ? "Warning" : "Recent"}
            </Tag>
          );
        }
      },
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (phone: string, record: CombinedPaymentStudent) => (
        <Space>
          <Text copyable>{phone}</Text>
          <Button
            type="text"
            size="small"
            icon={<PhoneOutlined />}
            onClick={() =>
              handleCallStudent({
                ...record,
                days_overdue: record.days_overdue || 0,
              })
            }
            title="Call student"
          />
        </Space>
      ),
    },
    {
      title: "Payment Due Day",
      dataIndex: "payment_due",
      key: "payment_due",
      align: "center",
      render: (day: number) => (
        <Tag icon={<CalendarOutlined />}>{day}th of month</Tag>
      ),
    },
    {
      title: "Days",
      dataIndex: "days",
      key: "days",
      align: "center",
      sorter: true,
      render: (_, record: CombinedPaymentStudent) => {
        if (record.status === "upcoming") {
          return (
            <Badge
              count={record.days_until_due}
              showZero
              style={{
                backgroundColor: "#1677ff",
              }}
            />
          );
        } else {
          const days = record.days_overdue || 0;
          return (
            <Badge
              count={days}
              showZero
              style={{
                backgroundColor:
                  days <= 5 ? "#faad14" : days <= 10 ? "#fa8c16" : "#f5222d",
              }}
            />
          );
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record: CombinedPaymentStudent) => (
        <Space>
          <Tooltip title="Call student">
            <Button
              type="primary"
              size="small"
              icon={<PhoneOutlined />}
              onClick={() =>
                handleCallStudent({
                  ...record,
                  days_overdue: record.days_overdue || 0,
                })
              }
            />
          </Tooltip>
          <Tooltip title="View payment history">
            <Button
              size="small"
              icon={<DollarOutlined />}
              onClick={() =>
                message.info("Payment history feature coming soon")
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        message="Error Loading Debtors"
        description="Unable to load debtors data. Please try again."
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <WarningOutlined style={{ color: "#faad14", marginRight: 8 }} />
            Debtors Management
          </Title>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              refetch();
              refetchUpcoming();
            }}
            loading={isLoading || isLoadingUpcoming}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Статистические карточки */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Debtors"
              value={stats.total}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Warning (≤5 days)"
              value={stats.warning}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Critical (>5 days)"
              value={stats.critical}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Days Overdue"
              value={stats.avgDaysOverdue}
              precision={1}
              suffix="days"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтры */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search by name or phone"
              allowClear
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.sortBy}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, sortBy: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="days_overdue">Days Overdue</Option>
              <Option value="fullname">Name</Option>
              <Option value="payment_due">Payment Due</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filters.sortOrder}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, sortOrder: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="desc">Descending</Option>
              <Option value="asc">Ascending</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={filters.overdueCategory}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, overdueCategory: value }))
              }
              style={{ width: "100%" }}
            >
              <Option value="all">All Students</Option>
              <Option value="warning">Warning (≤5 days)</Option>
              <Option value="critical">Critical (&gt;5 days)</Option>
              <Option value="upcoming">Upcoming Payments</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Таблица должников */}
      <Card>
        <Table
          columns={combinedColumns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={isLoading || isLoadingUpcoming}
          pagination={{
            total: filteredStudents.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} debtors`,
          }}
          scroll={{ x: 800 }}
          locale={{
            emptyText: isLoading ? "Loading..." : "No debtors found",
          }}
        />
      </Card>
    </div>
  );
};

export default Debtors;
