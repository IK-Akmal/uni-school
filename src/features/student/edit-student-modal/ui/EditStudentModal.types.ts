import type { Student } from "@/shared/types/models";

export interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  student?: Student;
  title?: string;
}
