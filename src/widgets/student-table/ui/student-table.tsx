import { Table } from "antd";

import type { Student } from "@/shared/types/models";
import { getColumns, rowKey } from "./student-table.helpers";
import type { StudentTableProps } from "./student-table.types";

export const StudentTable = ({ 
  data, 
  onEdit, 
  onDelete,
  onAddPayment 
}: StudentTableProps) => {
  return (
    <Table<Student>
      virtual
      tableLayout="fixed"
      rowKey={rowKey}
      pagination={false}
      columns={getColumns(onEdit, onDelete, onAddPayment)}
      dataSource={data}
      scroll={{ y: 500 }}
      // style={{ height: "100%" }}
    />
  );
};
