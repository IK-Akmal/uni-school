import React from "react";
import { Card, Typography } from "antd";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from "recharts";
import type { MonthlyRevenueStats } from "@/shared/api/statisticsApi";

const { Title } = Typography;

interface RevenueChartProps {
  data: MonthlyRevenueStats[];
  loading?: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <Card loading={loading}>
      <Title level={4}>Monthly Revenue & Payments</Title>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
          />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            labelFormatter={formatMonth}
            formatter={(value: number, name: string) => [
              name === 'revenue' ? formatCurrency(value) : value,
              name === 'revenue' ? 'Revenue' : 'Payments Count'
            ]}
          />
          <Bar 
            yAxisId="right"
            dataKey="paymentsCount" 
            fill="#52c41a" 
            name="paymentsCount"
            opacity={0.6}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            stroke="#1890ff" 
            strokeWidth={3}
            name="revenue"
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};
