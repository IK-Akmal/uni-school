import type { TableColumnsType } from "antd";
import { Button, Popconfirm, Space, Typography } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { Student } from "@/shared/types/models";

// Регистрируем плагины для работы с часовыми поясами
dayjs.extend(utc);
dayjs.extend(timezone);

export const rowKey = (row: Student) => row.id;

export const getColumns = (
  onEdit?: (student: Student) => void,
  onDelete?: (id: number) => void,
  onAddPayment?: (student: Student) => void
): TableColumnsType<Student> => [
  {
    title: "Name",
    dataIndex: "fullname",
    filterSearch: true,
    filterMode: "menu",
    render: (text: string) => <a>{text}</a>,
    onFilter: (value, record) => record.fullname.includes(value as string),
  },
  {
    title: "phone",
    dataIndex: "phone_number",
    ellipsis: true,
  },
  {
    title: "Address",
    dataIndex: "address",
    ellipsis: true,
  },
  {
    title: "Created At",
    dataIndex: "created_at",
    ellipsis: true,
    render: (text: string) => {
      return (
        <Typography.Text>
          {text ? dayjs.utc(text).local().format("MM-DD-YYYY HH:mm") : "—"}
        </Typography.Text>
      );
    },
    sorter: (a, b) => {
      if (!a.created_at) return -1;
      if (!b.created_at) return 1;
      return dayjs(a.created_at).unix() - dayjs(b.created_at).unix();
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 140,
    render: (_, record) => (
      <Space>
        {onEdit && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Edit student"
          />
        )}
        {onAddPayment && (
          <Button
            type="text"
            icon={<DollarOutlined />}
            onClick={() => onAddPayment(record)}
            title="Add payment"
          />
        )}
        {onDelete && (
          <Popconfirm
            title="Delete the student"
            description="Are you sure to delete this student?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="bottomLeft"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </Space>
    ),
  },
];
