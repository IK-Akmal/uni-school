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

// Интерфейс для расчета месячной суммы к оплате для должников
export interface StudentMonthlyDebt {
  student_id: number;
  student_fullname: string;
  phone_number: string;
  payment_due: number;
  // Общая стоимость всех групп студента
  total_course_price: number;
  // Сумма оплачено в текущем месяце
  paid_this_month: number;
  // Остаток к доплате (может быть отрицательным при переплате)
  total_monthly_amount: number;
  groups_count: number;
  groups: Array<{
    group_id: number;
    group_title: string;
    course_price: number;
  }>;
  // Дополнительные поля для управления должниками
  last_payment_date?: string;
  days_overdue?: number;
  is_overdue: boolean;
}
