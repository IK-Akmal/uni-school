import { Student } from "@/shared/types/models";

export interface StudentTableProps {
  scrollY?: string | number;
  data: Student[];
  onEdit?: (student: Student) => void;
  onDelete?: (id: number) => void;
  onAddPayment?: (student: Student) => void;
}
