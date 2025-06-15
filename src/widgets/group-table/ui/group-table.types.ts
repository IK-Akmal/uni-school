import type { Group } from "@/shared/types/models";

export interface GroupTableProps {
  data: Group[];
  onEdit?: (group: Group) => void;
  onDelete?: (id: number) => void;
  onViewStudents?: (group: Group) => void;
}
