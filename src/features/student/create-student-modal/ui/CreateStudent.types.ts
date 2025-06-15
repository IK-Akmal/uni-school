import type { Student } from "@/shared/types/models";

export interface CreateStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  student?: Student;
  mode?: 'create' | 'edit';
  title?: string;
}

export type FieldType = Partial<Student> & {
  groupIds?: number[];
};
