import type { TableColumnsType } from "antd";
import { Button, Popconfirm, Space } from "antd";
import { EditOutlined, DeleteOutlined, DollarOutlined } from "@ant-design/icons";
import type { Student } from "@/shared/types/models";

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
    title: "Actions",
    key: "actions",
    width: 120,
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
