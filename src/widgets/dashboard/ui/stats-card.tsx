import React from "react";
import { Card, Statistic } from "antd";

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  precision?: number;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision = 0,
  loading = false,
}) => {
  return (
    <Card loading={loading}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
      />
    </Card>
  );
};
