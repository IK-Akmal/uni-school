import type { TableColumnsType } from "antd";
import { Button, Popconfirm, Space } from "antd";
import { EditOutlined, DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import type { Group } from "@/shared/types/models";

export const rowKey = (row: Group) => row.id;

export const getColumns = (
  onEdit?: (group: Group) => void,
  onDelete?: (id: number) => void,
  onViewStudents?: (group: Group) => void
): TableColumnsType<Group> => [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
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
          />
        )}
        {onViewStudents && (
          <Button
            type="text"
            icon={<TeamOutlined />}
            onClick={() => onViewStudents(record)}
          />
        )}
        {onDelete && (
          <Popconfirm
            title="Delete group"
            description="Are you sure you want to delete this group?"
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
