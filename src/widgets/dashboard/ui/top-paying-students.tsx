import React from "react";
import { Card, Typography, List, Avatar, Tag } from "antd";
import { TrophyOutlined, UserOutlined } from "@ant-design/icons";
import type { TopPayingStudent } from "@/shared/api/statisticsApi";

const { Title, Text } = Typography;

interface TopPayingStudentsProps {
  data: TopPayingStudent[];
  loading?: boolean;
}

export const TopPayingStudentsCard: React.FC<TopPayingStudentsProps> = ({ data, loading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return '#ffd700'; // Gold
      case 1: return '#c0c0c0'; // Silver
      case 2: return '#cd7f32'; // Bronze
      default: return '#1890ff';
    }
  };

  const getRankIcon = (index: number) => {
    if (index < 3) {
      return <TrophyOutlined style={{ color: getRankColor(index) }} />;
    }
    return <UserOutlined />;
  };

  return (
    <Card loading={loading}>
      <Title level={4}>
        <TrophyOutlined style={{ color: '#ffd700', marginRight: 8 }} />
        Top Paying Students
      </Title>
      <List
        itemLayout="horizontal"
        dataSource={data?.slice(0, 10) || []}
        renderItem={(student, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={getRankIcon(index)} 
                  style={{ backgroundColor: getRankColor(index) }}
                />
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{student.fullname}</Text>
                  <Tag color="blue">{formatCurrency(student.total_paid)}</Tag>
                </div>
              }
              description={
                <div style={{ display: 'flex', gap: 16 }}>
                  <Text type="secondary">{student.payments_count} payments</Text>
                  <Text type="secondary">Avg: {formatCurrency(student.avg_payment)}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
