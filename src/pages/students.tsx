import { useState, useMemo, useDeferredValue } from "react";
import { Button, Flex, Space, Input } from "antd";

import { StudentTable } from "@/widgets/student-table";
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
} from "@/shared/api/studentApi";
import { EditStudentModal } from "@/features/student/edit-student-modal";
import { PaymentFormModal } from "@/features/payment/payment-form-modal";
import { Student } from "@/shared/types/models";
import { CreateStudentModal } from "@/features/student/create-student-modal";

const Students = () => {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // RTK Query хуки
  const { data: students, isLoading, error } = useGetStudentsQuery();
  const [deleteStudent] = useDeleteStudentMutation();

  // Фильтрация студентов на основе поискового запроса
  const filteredStudents = useMemo(() => {
    if (!students || !deferredSearchQuery.trim()) {
      return students;
    }

    const query = deferredSearchQuery.toLowerCase().trim();
    return students.filter((student) => {
      return (
        student.fullname.toLowerCase().includes(query) ||
        (student.phone_number &&
          student.phone_number.toLowerCase().includes(query)) ||
        (student.address && student.address.toLowerCase().includes(query))
      );
    });
  }, [students, deferredSearchQuery]);

  const handleCreateStudent = () => {
    setSelectedStudent(undefined);
    setOpenCreateModal(true);
  };

  const handleCreateStudentSuccess = () => {
    setOpenCreateModal(false);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setOpenEditModal(true);
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
    <Space
      direction="vertical"
      style={{ width: "100%", padding: "16px", display: "flex" }}
      size="large"
    >
      <CreateStudentModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={handleCreateStudentSuccess}
      />

      <EditStudentModal
        open={openEditModal}
        student={selectedStudent}
        onClose={() => setOpenEditModal(false)}
        onSuccess={() => setOpenEditModal(false)}
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

      <Flex justify="space-between" align="center" gap={16}>
        <Input.Search
          allowClear
          placeholder="Search students by name, phone number or address"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="primary" onClick={handleCreateStudent}>
          Create Student
        </Button>
      </Flex>

      <StudentTable
        data={filteredStudents ?? []}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onAddPayment={handleAddPayment}
      />
    </Space>
  );
};

export default Students;
