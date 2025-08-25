import React from "react";
import { Card, Typography, Progress, Row, Col, Statistic } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import type { GroupCapacityStats } from "@/shared/api/statisticsApi";

const { Title } = Typography;

interface GroupCapacityStatsProps {
  data: GroupCapacityStats[];
  loading?: boolean;
}

export const GroupCapacityStatsCard: React.FC<GroupCapacityStatsProps> = ({ data, loading }) => {
  const totalCapacity = data?.reduce((sum, group) => sum + group.capacity, 0) || 0;
  const totalStudents = data?.reduce((sum, group) => sum + group.current_students, 0) || 0;
  const overallFillPercentage = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <Card loading={loading}>
      <Title level={4}>
        <TeamOutlined style={{ color: '#52c41a', marginRight: 8 }} />
        Group Capacity Overview
      </Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic title="Total Students" value={totalStudents} />
        </Col>
        <Col span={8}>
          <Statistic title="Total Capacity" value={totalCapacity} />
        </Col>
        <Col span={8}>
          <Statistic 
            title="Overall Fill Rate" 
            value={overallFillPercentage} 
            suffix="%" 
            valueStyle={{ color: overallFillPercentage > 80 ? '#cf1322' : '#3f8600' }}
          />
        </Col>
      </Row>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {data?.map((group) => (
          <div key={group.group_id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{group.group_title}</span>
              <span style={{ color: '#666' }}>
                {group.current_students}/{group.capacity}
              </span>
            </div>
            <Progress
              percent={group.fill_percentage}
              status={group.fill_percentage > 90 ? 'exception' : group.fill_percentage > 75 ? 'active' : 'success'}
              strokeColor={
                group.fill_percentage > 90 ? '#ff4d4f' : 
                group.fill_percentage > 75 ? '#faad14' : '#52c41a'
              }
            />
          </div>
        ))}
      </div>
    </Card>
  );
};
