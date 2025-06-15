import { Table } from "antd";
import { useEffect, useState } from "react";
import type { Group } from "@/shared/types/models";
import { getColumns, rowKey } from "./group-table.helpers";
import type { GroupTableProps } from "./group-table.types";

export const GroupTable = ({
  data,
  onEdit,
  onDelete,
  onViewStudents,
}: GroupTableProps) => {
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
    <Table<Group>
      virtual
      tableLayout="fixed"
      rowKey={rowKey}
      pagination={false}
      columns={getColumns(onEdit, onDelete, onViewStudents)}
      dataSource={data}
      scroll={{ y: tableHeight }}
      style={{ height: "100%" }}
    />
  );
};
