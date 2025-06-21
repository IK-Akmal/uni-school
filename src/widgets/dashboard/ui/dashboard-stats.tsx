import React from 'react';
import { Row, Col, Spin } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  BankOutlined 
} from '@ant-design/icons';
import { StatsCard } from './stats-card';
import { DashboardStats } from '@/shared/api/statisticsApi';

interface DashboardStatsProps {
  stats?: DashboardStats;
  loading: boolean;
}

export const DashboardStatsCards: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return <Spin size="large" />;
  }

  if (!stats) {
    return null;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          prefix={<UserOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Total Groups"
          value={stats.totalGroups}
          prefix={<TeamOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Total Payments"
          value={stats.totalPayments}
          prefix={<DollarOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Total Payment Amount"
          value={stats.totalPaymentAmount}
          precision={2}
          prefix={<BankOutlined />}
          suffix="sum"
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="New Students This Month"
          value={stats.studentsThisMonth}
          prefix={<UserOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="New Groups This Month"
          value={stats.groupsThisMonth}
          prefix={<TeamOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Payments This Month"
          value={stats.paymentsThisMonth}
          prefix={<DollarOutlined />}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <StatsCard
          title="Payment Amount This Month"
          value={stats.paymentAmountThisMonth}
          precision={2}
          prefix={<BankOutlined />}
          suffix="sum"
        />
      </Col>
    </Row>
  );
};
