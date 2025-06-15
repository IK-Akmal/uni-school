import { Table } from "antd";
import { useEffect, useState } from "react";

import type { Student } from "@/shared/types/models";
import { getColumns, rowKey } from "./student-table.helpers";
import type { StudentTableProps } from "./student-table.types";

export const StudentTable = ({
  data,
  onEdit,
  onDelete,
  onAddPayment,
}: StudentTableProps) => {
  const [tableHeight, setTableHeight] = useState<number>(
    () => window.innerHeight - 305
  );

  // Обновляем высоту таблицы при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      // Вычисляем высоту таблицы: высота окна минус отступы для хедера, поиска и т.д.
      setTableHeight(window.innerHeight - 305);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Устанавливаем начальную высоту

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Table<Student>
      virtual
      tableLayout="fixed"
      rowKey={rowKey}
      pagination={false}
      columns={getColumns(onEdit, onDelete, onAddPayment)}
      dataSource={data}
      scroll={{ y: tableHeight }}
      style={{ height: "100%" }}
    />
  );
};
