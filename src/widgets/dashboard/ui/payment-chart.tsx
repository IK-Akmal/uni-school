import React from 'react';
import { Card, Typography } from 'antd';
import {
  ComposedChart,
  Line,
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

interface PaymentChartProps {
  title: string;
  data: any[];
  countKey: string;
  amountKey: string;
  loading?: boolean;
}

export const PaymentChart: React.FC<PaymentChartProps> = ({
  title,
  data,
  countKey,
  amountKey,
  loading = false,
}) => {
  return (
    <Card loading={loading} style={{ height: '100%' }}>
      <Title level={4}>{title}</Title>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
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
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => {
              if (name === countKey) return [value, 'Number of Payments'];
              return [`${value} sum`, 'Payment Amount'];
            }}
            labelFormatter={formatMonth}
          />
          <Legend />
          <Bar yAxisId="left" dataKey={countKey} fill="#8884d8" name="Number of Payments" />
          <Line yAxisId="right" type="monotone" dataKey={amountKey} stroke="#ff7300" name="Payment Amount" />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};
