import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Popconfirm,
  Typography,
  type TableProps,
} from "antd";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import type { PaymentStudent } from "@/shared/types/models";

interface PaymentTableProps {
  payments: PaymentStudent[];
  isLoading: boolean;
  onDeletePayment: (id: number) => void;
  onEditPayment: (payment: PaymentStudent) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  isLoading,
  onDeletePayment,
  onEditPayment,
}) => {
  const [tableHeight, setTableHeight] = useState<number>(500);

  // Устанавливаем динамическую высоту таблицы
  useEffect(() => {
    const updateHeight = () => {
      // Оставляем место для заголовка, фильтров и пагинации
      const availableHeight = window.innerHeight - 280;
      setTableHeight(Math.max(400, availableHeight));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const columns: TableProps<PaymentStudent>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Typography.Text>{amount.toFixed(2)}</Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Student",
      key: "student",
      dataIndex: "student_fullname",
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditPayment(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete payment"
            description="Are you sure you want to delete this payment?"
            onConfirm={() => onDeletePayment(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={payments}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{
        pageSize: 10,
        position: ["bottomCenter"],
        showTotal: (total) => `Total ${total} payments`,
      }}
      scroll={{ y: tableHeight }}
      size="middle"
    />
  );
};
