import React from "react";
import { Badge, Button, List, Popover, Typography, Space } from "antd";
import { WarningOutlined, PhoneOutlined, CalendarOutlined } from "@ant-design/icons";
import { useGetOverduePaymentStudentsQuery } from "@/shared/api/statisticsApi";
import type { OverduePaymentStudent } from "@/shared/api/statisticsApi";

const { Text } = Typography;

// Компонент для отображения детальной информации о студенте с просроченным платежом
const OverdueStudentItem: React.FC<{ student: OverduePaymentStudent }> = ({ student }) => {
  return (
    <List.Item>
      <List.Item.Meta
        title={<Text strong>{student.fullname}</Text>}
        description={
          <Space direction="vertical" size="small">
            <Space>
              <CalendarOutlined />
              <Text type="secondary">
                Payment due day: {student.payment_due}
              </Text>
              <Badge 
                count={`${student.days_overdue} days overdue`} 
                style={{ backgroundColor: student.days_overdue > 5 ? "#f5222d" : "#faad14" }} 
              />
            </Space>
            <Space>
              <PhoneOutlined />
              <Text copyable>{student.phone_number}</Text>
            </Space>
          </Space>
        }
      />
    </List.Item>
  );
};

// Основной компонент уведомлений о просроченных платежах
export const OverduePaymentsAlert: React.FC = () => {
  const { data: overdueStudents, isLoading, error } = useGetOverduePaymentStudentsQuery();

  if (isLoading) {
    return null;
  }

  if (error || !overdueStudents || overdueStudents.length === 0) {
    return null;
  }

  const content = (
    <List
      itemLayout="horizontal"
      dataSource={overdueStudents}
      renderItem={(student) => <OverdueStudentItem student={student} />}
      style={{ maxHeight: "400px", overflow: "auto", width: "350px" }}
    />
  );

  return (
    <Popover 
      content={content}
      title="Students with Overdue Payments"
      trigger="click"
      placement="bottomRight"
    >
      <Badge count={overdueStudents.length} overflowCount={99}>
        <Button 
          type="primary" 
          danger 
          icon={<WarningOutlined />}
        >
          Overdue Payments
        </Button>
      </Badge>
    </Popover>
  );
};
