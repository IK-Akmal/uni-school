import React from "react";
import { Card, Typography, Table, Progress, Tag } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import type { GroupOverdueStats } from "@/shared/api/statisticsApi";

const { Title } = Typography;

interface GroupOverdueStatsProps {
  data: GroupOverdueStats[];
  loading?: boolean;
}

export const GroupOverdueStatsCard: React.FC<GroupOverdueStatsProps> = ({ data, loading }) => {
  const columns = [
    {
      title: 'Group',
      dataIndex: 'group_title',
      key: 'group_title',
      render: (title: string) => <strong>{title}</strong>,
    },
    {
      title: 'Overdue Students',
      dataIndex: 'overdue_count',
      key: 'overdue_count',
      render: (count: number, record: GroupOverdueStats) => (
        <span>
          {count} / {record.total_students}
        </span>
      ),
    },
    {
      title: 'Overdue Rate',
      dataIndex: 'overdue_percentage',
      key: 'overdue_percentage',
      render: (percentage: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress 
            percent={percentage} 
            size="small" 
            status={percentage > 50 ? 'exception' : percentage > 25 ? 'active' : 'success'}
            style={{ minWidth: 100 }}
          />
          <Tag color={percentage > 50 ? 'red' : percentage > 25 ? 'orange' : 'green'}>
            {percentage}%
          </Tag>
        </div>
      ),
    },
  ];

  return (
    <Card loading={loading}>
      <Title level={4}>
        <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
        Overdue Payments by Group
      </Title>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="group_id"
        pagination={{ pageSize: 5, showSizeChanger: false }}
        size="small"
      />
    </Card>
  );
};
