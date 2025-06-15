import type { TableColumnsType } from "antd";
import { Button, Popconfirm, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Student } from "@/shared/types/models";

export const rowKey = (row: Student) => row.id;

export const getColumns = (
  onEdit?: (student: Student) => void,
  onDelete?: (id: number) => void
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
