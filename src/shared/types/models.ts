export interface Student {
  id: number;
  fullname: string;
  phone_number: string;
  payment_due: number;
  address: string | null;
  created_at: string;
}

export interface Group {
  id: number;
  title: string;
  course_price: number;
  created_at: string;
}

export interface Payment {
  id: number;
  date: string;
  amount: number;
  group_id: number;
  student_id: number;
  course_price_at_payment: number;
  payment_period: string;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

export interface StudentGroup {
  student_id: number;
  group_id: number;
}

export interface PaymentBalance {
  id: number;
  student_id: number;
  group_id: number;
  period: string;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  last_updated: string;
}

export interface PaymentStudent extends Payment {
  student_fullname: string;
  group_title: string;
}

export interface PaymentSummary {
  student_id: number;
  group_id: number;
  student_fullname: string;
  group_title: string;
  total_expected: number;
  total_paid: number;
  current_balance: number;
  payment_status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  payment_due: number;
  is_overdue: boolean;
}

export interface MonthlyPaymentStatus {
  period: string;
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
}
