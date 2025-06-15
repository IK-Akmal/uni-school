import { useState } from "react";
import { Button, Flex, Space } from "antd";

import { StudentTable } from "@/widgets/student-table";
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
} from "@/shared/api/studentApi";
import { StudentFormModal } from "@/features/student/student-form-modal";
import { PaymentFormModal } from "@/features/payment/payment-form-modal";
import { Student } from "@/shared/types/models";

const Students = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // RTK Query хуки
  const { data: students, isLoading, error } = useGetStudentsQuery();
  const [deleteStudent] = useDeleteStudentMutation();

  const handleCreateStudent = () => {
    setSelectedStudent(undefined);
    setModalMode("create");
    setOpenModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleAddPayment = (student: Student) => {
    setSelectedStudent(student);
    setOpenPaymentModal(true);
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      await deleteStudent(id);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  if (isLoading) return <div>Loading students...</div>;
  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <StudentFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => setOpenModal(false)}
        student={selectedStudent}
        mode={modalMode}
      />
      
      {selectedStudent && (
        <PaymentFormModal
          open={openPaymentModal}
          onClose={() => setOpenPaymentModal(false)}
          onSuccess={() => setOpenPaymentModal(false)}
          studentId={selectedStudent.id}
          title={`Add Payment for ${selectedStudent.fullname}`}
        />
      )}

      <Flex justify="end">
        <Button type="primary" onClick={handleCreateStudent}>
          Add Student
        </Button>
      </Flex>

      <StudentTable
        data={students ?? []}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onAddPayment={handleAddPayment}
      />
    </Space>
  );
};

export default Students;
