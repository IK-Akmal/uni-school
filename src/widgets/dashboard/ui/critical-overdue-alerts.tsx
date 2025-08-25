import React from "react";
import { Card, Typography, Alert, List, Tag, Button, Space } from "antd";
import { ExclamationCircleOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import type { CriticalOverdueAlert } from "@/shared/api/statisticsApi";

const { Title, Text } = Typography;

interface CriticalOverdueAlertsProps {
  data: CriticalOverdueAlert[];
  loading?: boolean;
}

export const CriticalOverdueAlertsCard: React.FC<CriticalOverdueAlertsProps> = ({ data, loading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getSeverityColor = (days: number) => {
    if (days >= 14) return 'red';
    if (days >= 7) return 'orange';
    return 'yellow';
  };

  const getSeverityText = (days: number) => {
    if (days >= 14) return 'Critical';
    if (days >= 7) return 'High';
    return 'Medium';
  };

  if (!data || data.length === 0) {
    return (
      <Card loading={loading}>
        <Title level={4}>
          <ExclamationCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Critical Overdue Alerts
        </Title>
        <Alert
          message="No Critical Overdue Payments"
          description="All students are up to date with their payments!"
          type="success"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card loading={loading}>
      <Title level={4}>
        <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
        Critical Overdue Alerts ({data.length})
      </Title>
      
      <Alert
        message="Urgent Action Required"
        description={`${data.length} students have critical overdue payments that need immediate attention.`}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <List
        itemLayout="horizontal"
        dataSource={data?.slice(0, 10) || []}
        renderItem={(alert) => (
          <List.Item
            actions={[
              <Button 
                type="primary" 
                size="small" 
                icon={<PhoneOutlined />}
                href={`tel:${alert.phone_number}`}
              >
                Call
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<UserOutlined style={{ fontSize: 16, color: '#666' }} />}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{alert.fullname}</Text>
                  <Space>
                    <Tag color={getSeverityColor(alert.days_overdue)}>
                      {getSeverityText(alert.days_overdue)}
                    </Tag>
                    <Tag color="red">{formatCurrency(alert.overdue_amount)}</Tag>
                  </Space>
                </div>
              }
              description={
                <div>
                  <Text type="secondary">Group: {alert.group_title}</Text>
                  <br />
                  <Text type="secondary">
                    {alert.days_overdue} days overdue • Phone: {alert.phone_number}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      
      {data.length > 10 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Showing 10 of {data.length} critical alerts. Check the Debtors page for complete list.
          </Text>
        </div>
      )}
    </Card>
  );
};
