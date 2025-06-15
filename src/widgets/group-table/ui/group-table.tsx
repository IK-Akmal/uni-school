import { Table } from "antd";
import type { Group } from "@/shared/types/models";
import { getColumns, rowKey } from "./group-table.helpers";
import type { GroupTableProps } from "./group-table.types";

export const GroupTable = ({ 
  data, 
  onEdit, 
  onDelete,
  onViewStudents
}: GroupTableProps) => {
  return (
    <Table<Group>
      virtual
      tableLayout="fixed"
      rowKey={rowKey}
      pagination={false}
      columns={getColumns(onEdit, onDelete, onViewStudents)}
      dataSource={data}
      scroll={{ y: 500 }}
    />
  );
};
