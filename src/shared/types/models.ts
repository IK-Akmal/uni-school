export interface Student {
  id: number;
  fullname: string;
  phone_number: string;
  payment_due: string;
  address: string | null;
}

export interface Group {
  id: number;
  title: string;
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
