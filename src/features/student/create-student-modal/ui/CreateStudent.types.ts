import type { Student } from "@/shared/types/models";

export interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export type FieldType = Partial<Student> & {
  groupIds?: number[];
};
