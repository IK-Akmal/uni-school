import React from "react";
import { Row, Col, Divider, Spin, Typography } from "antd";
import { useGetMonthlyStudentStatsQuery, useGetMonthlyGroupStatsQuery, useGetMonthlyPaymentStatsQuery, useGetDashboardStatsQuery } from "@/shared/api/statisticsApi";
import { MonthlyChart } from "./monthly-chart";
import { PaymentChart } from "./payment-chart";
import { DashboardStatsCards } from "./dashboard-stats";
import { OverduePaymentsAlert } from "./overdue-payments-alert";

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  // Загружаем данные для дашборда
  const { data: dashboardStats, isLoading: isLoadingStats } = useGetDashboardStatsQuery();
  const { data: studentStats, isLoading: isLoadingStudents } = useGetMonthlyStudentStatsQuery();
  const { data: groupStats, isLoading: isLoadingGroups } = useGetMonthlyGroupStatsQuery();
  const { data: paymentStats, isLoading: isLoadingPayments } = useGetMonthlyPaymentStatsQuery();

  return (
    <div>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}>School Overview</Title>
        </Col>
        <Col>
          <OverduePaymentsAlert />
        </Col>
      </Row>
      
      <Divider orientation="left">General Statistics</Divider>
      <DashboardStatsCards stats={dashboardStats} loading={isLoadingStats} />
      
      <Divider orientation="left">Statistics for the Last 6 Months</Divider>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          {isLoadingStudents ? (
            <Spin size="large" />
          ) : (
            <MonthlyChart
              title="New Students"
              data={studentStats || []}
              dataKey="count"
              color="#1890ff"
            />
          )}
        </Col>
        <Col xs={24} md={12}>
          {isLoadingGroups ? (
            <Spin size="large" />
          ) : (
            <MonthlyChart
              title="New Groups"
              data={groupStats || []}
              dataKey="count"
              color="#52c41a"
            />
          )}
        </Col>
        <Col xs={24}>
          {isLoadingPayments ? (
            <Spin size="large" />
          ) : (
            <PaymentChart
              title="Payment Statistics"
              data={paymentStats || []}
              countKey="count"
              amountKey="totalAmount"
            />
          )}
        </Col>
      </Row>
    </div>
  );
};
