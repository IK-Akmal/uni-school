import { useState } from "react";
import { 
  useGetPaymentsQuery, 
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useAddPaymentToStudentMutation
} from "../shared/api/paymentApi";
import { useGetStudentsQuery } from "../shared/api/studentApi";
import { Payment } from "../shared/types/models";

const Payments = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newPayment, setNewPayment] = useState<Omit<Payment, "id">>({
    date: new Date().toISOString().split('T')[0],
    amount: 0
  });
  
  // RTK Query хуки
  const { data: payments, isLoading: isLoadingPayments, error: paymentsError } = useGetPaymentsQuery();
  const { data: students, isLoading: isLoadingStudents } = useGetStudentsQuery();
  const [createPayment] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const [addPaymentToStudent] = useAddPaymentToStudentMutation();
  
  // Обработчики событий
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ 
      ...prev, 
      [name]: name === "amount" ? parseFloat(value) : value 
    }));
  };
  
  const handleCreatePayment = async () => {
    try {
      await createPayment(newPayment);
      setNewPayment({
        date: new Date().toISOString().split('T')[0],
        amount: 0
      });
    } catch (error) {
      console.error("Error creating payment:", error);
    }
  };
  
  const handleDeletePayment = async (id: number) => {
    try {
      await deletePayment(id);
      if (selectedPaymentId === id) {
        setSelectedPaymentId(null);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };
  
  const handleAddPaymentToStudent = async () => {
    if (!selectedPaymentId || !selectedStudentId) return;
    
    try {
      await addPaymentToStudent({
        studentId: selectedStudentId,
        paymentId: selectedPaymentId
      });
      
      // Сбросить выбор после добавления
      setSelectedPaymentId(null);
      setSelectedStudentId(null);
    } catch (error) {
      console.error("Error adding payment to student:", error);
    }
  };
  
  if (isLoadingPayments) return <div>Загрузка платежей...</div>;
  if (paymentsError) return <div>Ошибка: {JSON.stringify(paymentsError)}</div>;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Платежи</h1>
      
      {/* Форма создания платежа */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Добавить новый платеж</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Дата</label>
            <input
              type="date"
              name="date"
              value={newPayment.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Сумма</label>
            <input
              type="number"
              name="amount"
              value={newPayment.amount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <button
          onClick={handleCreatePayment}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Добавить платеж
        </button>
      </div>
      
      {/* Привязка платежа к студенту */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Привязать платеж к студенту</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Выберите платеж</label>
            <select
              value={selectedPaymentId || ""}
              onChange={(e) => setSelectedPaymentId(Number(e.target.value) || null)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Выберите платеж --</option>
              {payments?.map(payment => (
                <option key={payment.id} value={payment.id}>
                  {payment.date} - {payment.amount} руб.
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Выберите студента</label>
            <select
              value={selectedStudentId || ""}
              onChange={(e) => setSelectedStudentId(Number(e.target.value) || null)}
              className="w-full p-2 border rounded"
              disabled={isLoadingStudents}
            >
              <option value="">-- Выберите студента --</option>
              {students?.map(student => (
                <option key={student.id} value={student.id}>
                  {student.fullname}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAddPaymentToStudent}
          disabled={!selectedPaymentId || !selectedStudentId}
          className={`px-4 py-2 rounded ${
            !selectedPaymentId || !selectedStudentId
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Привязать платеж к студенту
        </button>
      </div>
      
      {/* Список платежей */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Список платежей</h2>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-4 text-left">ID</th>
                  <th className="py-2 px-4 text-left">Дата</th>
                  <th className="py-2 px-4 text-left">Сумма</th>
                  <th className="py-2 px-4 text-left">Действия</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: Payment) => (
                  <tr 
                    key={payment.id} 
                    className={`border-t ${selectedPaymentId === payment.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-2 px-4">{payment.id}</td>
                    <td className="py-2 px-4">{payment.date}</td>
                    <td className="py-2 px-4">{payment.amount} руб.</td>
                    <td className="py-2 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPaymentId(payment.id)}
                          className={`text-blue-500 hover:text-blue-700 ${selectedPaymentId === payment.id ? 'font-bold' : ''}`}
                        >
                          Выбрать
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Нет доступных платежей</p>
        )}
      </div>
    </div>
  );
};

export default Payments;
