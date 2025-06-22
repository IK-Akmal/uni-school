import type { TableColumnsType } from "antd";
import { Button, Popconfirm, Space, Typography } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { EditOutlined, DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import type { Group } from "@/shared/types/models";

// Регистрируем плагины для работы с часовыми поясами
dayjs.extend(utc);
dayjs.extend(timezone);

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
    title: "Course Price",
    dataIndex: "course_price",
    key: "course_price",
    // width: 120,
    render: (price: number) => (
      <Typography.Text>
        {new Intl.NumberFormat("uz", {
          style: "currency",
          currency: "sum",
        }).format(price)}
      </Typography.Text>
    ),
    sorter: (a, b) => (a.course_price || 0) - (b.course_price || 0),
  },
  {
    title: "Created At",
    dataIndex: "created_at",
    key: "created_at",
    render: (text: string) => (
      <Typography.Text>
        {text ? dayjs.utc(text).local().format("MM-DD-YYYY HH:mm") : "—"}
      </Typography.Text>
    ),
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
