import type { FormInstance } from "antd";

import type { Group, Student } from "@/shared/types/models";

export interface StudentFormProps {
  open: boolean;
  title: string;
  groups: Group[];
  isLoading: boolean;
  buttonLabel: string;
  form: FormInstance<FieldType>;

  onFinish: (values: FieldType) => void;
  onClose: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

export type FieldType = Partial<Student> & {
  groupIds?: number[];
};
