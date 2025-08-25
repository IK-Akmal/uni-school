import React from "react";
import { Row, Col, Divider, Spin, Typography } from "antd";
import {
  useGetMonthlyStudentStatsQuery,
  useGetMonthlyGroupStatsQuery,
  useGetMonthlyPaymentStatsQuery,
  useGetDashboardStatsQuery,
  useGetMonthlyRevenueStatsQuery,
  useGetGroupOverdueStatsQuery,
  useGetTopPayingStudentsQuery,
  useGetCriticalOverdueAlertsQuery,
} from "@/shared/api/statisticsApi";
import { MonthlyChart } from "./monthly-chart";
import { PaymentChart } from "./payment-chart";
import { DashboardStatsCards } from "./dashboard-stats";
import { OverduePaymentsAlert } from "./overdue-payments-alert";
import { RevenueChart } from "./revenue-chart";
import { GroupOverdueStatsCard } from "./group-overdue-stats";
import { TopPayingStudentsCard } from "./top-paying-students";
import { CriticalOverdueAlertsCard } from "./critical-overdue-alerts";

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  // Загружаем данные для дашборда
  const { data: dashboardStats, isLoading: isLoadingStats } =
    useGetDashboardStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: studentStats, isLoading: isLoadingStudents } =
    useGetMonthlyStudentStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: groupStats, isLoading: isLoadingGroups } =
    useGetMonthlyGroupStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: paymentStats, isLoading: isLoadingPayments } =
    useGetMonthlyPaymentStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });

  // Загружаем новые данные для финансовой аналитики
  const { data: revenueStats, isLoading: isLoadingRevenue } =
    useGetMonthlyRevenueStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: groupOverdueStats, isLoading: isLoadingGroupOverdue } =
    useGetGroupOverdueStatsQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: topPayingStudents, isLoading: isLoadingTopPaying } =
    useGetTopPayingStudentsQuery({ limit: 10 }, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });
  const { data: criticalOverdueAlerts, isLoading: isLoadingCriticalOverdue } =
    useGetCriticalOverdueAlertsQuery({ daysThreshold: 7 }, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    });

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

      <Divider orientation="left">Financial Analytics</Divider>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <RevenueChart 
            data={revenueStats || []} 
            loading={isLoadingRevenue} 
          />
        </Col>
        <Col xs={24} lg={12}>
          <GroupOverdueStatsCard 
            data={groupOverdueStats || []} 
            loading={isLoadingGroupOverdue} 
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <TopPayingStudentsCard 
            data={topPayingStudents || []} 
            loading={isLoadingTopPaying} 
          />
        </Col>
        <Col xs={24} lg={12}>
          <CriticalOverdueAlertsCard 
            data={criticalOverdueAlerts || []} 
            loading={isLoadingCriticalOverdue} 
          />
        </Col>
      </Row>
    </div>
  );
};
