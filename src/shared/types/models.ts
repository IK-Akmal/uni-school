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
}

export interface StudentGroup {
  student_id: number;
  group_id: number;
}

export interface StudentPayment {
  student_id: number;
  payment_id: number;
}

export interface PaymentStudent extends Payment {
  student_id: number;
  student_fullname: string;
}
