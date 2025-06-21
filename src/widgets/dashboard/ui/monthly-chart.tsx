import React from 'react';
import { Card, Typography } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

const { Title } = Typography;

// Функция для форматирования месяца в более читаемый формат
const formatMonth = (month: string) => {
  if (!month) return '';
  return dayjs(month).format('MMM YYYY');
};

interface MonthlyChartProps {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  loading?: boolean;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  title,
  data,
  dataKey,
  color,
  loading = false,
}) => {
  return (
    <Card loading={loading} style={{ height: '100%' }}>
      <Title level={4}>{title}</Title>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tickFormatter={formatMonth} />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, dataKey]}
            labelFormatter={formatMonth}
          />
          <Legend />
          <Bar dataKey={dataKey} fill={color} name={title} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
