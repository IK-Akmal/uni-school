import React, { useState, useEffect } from "react";
import {
  Table,
  Space,
  Button,
  Popconfirm,
  Typography,
  type TableProps,
} from "antd";
import { useNavigate } from "react-router";

import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

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
  const navigate = useNavigate();
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
      title: "Student",
      key: "student",
      dataIndex: "student_fullname",
      width: 150,
      sorter: (a, b) => a.student_fullname.localeCompare(b.student_fullname),
      fixed: "left",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: (date: string) => (
        <Typography.Text>
          {new Date(date).toLocaleDateString("en-GB")}
        </Typography.Text>
      ),
    },

    {
      title: "Group",
      key: "group",
      dataIndex: "group_title",
      width: 120,
      sorter: (a, b) => a.group_title.localeCompare(b.group_title),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 110,
      render: (amount: number) => (
        <Typography.Text strong>
          {new Intl.NumberFormat("uz", {
            style: "currency",
            currency: "sum",
          }).format(amount)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Period",
      dataIndex: "payment_period",
      key: "payment_period",
      width: 100,
      sorter: (a, b) => a.payment_period.localeCompare(b.payment_period),
    },
    {
      title: "Type",
      dataIndex: "payment_type",
      key: "payment_type",
      width: 100,
      render: (type: string) => (
        <Typography.Text
          style={{
            textTransform: "capitalize",
            color:
              type === "full"
                ? "#52c41a"
                : type === "partial"
                ? "#faad14"
                : "#1677ff",
          }}
        >
          {type}
        </Typography.Text>
      ),
      sorter: (a, b) => a.payment_type.localeCompare(b.payment_type),
    },
    {
      title: "Course Price",
      dataIndex: "course_price_at_payment",
      key: "course_price_at_payment",
      width: 120,
      render: (price: number) => (
        <Typography.Text type="secondary">
          {new Intl.NumberFormat("uz", {
            style: "currency",
            currency: "sum",
          }).format(price)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.course_price_at_payment - b.course_price_at_payment,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      render: (notes: string | null) => (
        <Typography.Text
          ellipsis={{ tooltip: notes }}
          style={{ maxWidth: 150 }}
        >
          {notes || "-"}
        </Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payment/${record.id}`)}
            title="View Details"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditPayment(record)}
            title="Edit Payment"
          />

          <Popconfirm
            title="Delete payment"
            description="Are you sure you want to delete this payment?"
            onConfirm={() => onDeletePayment(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} title="Delete Payment" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      loading={isLoading}
      dataSource={payments}
      pagination={{
        pageSize: 10,
        position: ["bottomCenter"],
        showTotal: (total) => `Total ${total} payments`,
      }}
      scroll={{ y: tableHeight }}
      // size="middle"
    />
  );
};
