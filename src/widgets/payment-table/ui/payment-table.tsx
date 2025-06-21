import React, { useState, useEffect, useMemo } from "react";
import { Table, Space, Button, Popconfirm, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import type { Payment } from "@/shared/types/models";
import { useGetPaymentStudentsQuery } from "@/shared/api/paymentApi";

interface PaymentTableProps {
  payments: Payment[];
  isLoading: boolean;
  onDeletePayment: (id: number) => void;
  onSelectPayment: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  isLoading,
  onDeletePayment,
  onSelectPayment,
  onEditPayment,
}) => {
  const [tableHeight, setTableHeight] = useState<number>(500);

  // Получаем данные о студентах, связанных с платежами
  const { data: paymentStudents = [], isLoading: isLoadingStudents } =
    useGetPaymentStudentsQuery();

  // Создаем словарь для быстрого поиска студента по id платежа
  const studentsByPaymentId = useMemo(() => {
    const map: Record<number, string> = {};
    paymentStudents.forEach((item) => {
      if (item.payment_id) {
        map[item.payment_id] = item.fullname;
      }
    });
    return map;
  }, [paymentStudents]);

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

  const columns: TableProps<Payment>["columns"] = [
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
      render: (_, record) => {
        const studentName = studentsByPaymentId[record.id];
        // Отладочная информация
        return <Typography.Text>{studentName || "—"}</Typography.Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => onSelectPayment(record)}>
            Select
          </Button>
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

  // Общий статус загрузки
  const loading = isLoading || isLoadingStudents;

  return (
    <Table
      dataSource={payments}
      columns={columns}
      rowKey="id"
      loading={loading}
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
