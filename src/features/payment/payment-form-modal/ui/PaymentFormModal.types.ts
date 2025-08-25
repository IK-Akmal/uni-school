import type { Dayjs } from "dayjs";

export interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  studentId: number;
  title?: string;
}

export type FieldType = {
  date: Dayjs | null;
  amount: number;
  paymentType: string;
  paymentPeriod: string;
  groupId: number;
  coursePriceAtPayment?: number;
  notes?: string;
};
