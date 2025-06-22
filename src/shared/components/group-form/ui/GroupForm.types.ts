import type { FormInstance } from "antd";

export interface FieldType {
  title: string;
  course_price: number;
  studentIds?: number[];
}

export interface GroupFormProps {
  form: FormInstance<FieldType>;
  open: boolean;
  title: string;
  onClose: () => void;
  onFinish: (values: FieldType) => Promise<void>;
  isLoading: boolean;
  buttonLabel: string;
  students?: { id: number; fullname: string }[];
}
