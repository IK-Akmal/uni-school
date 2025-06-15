import { useState } from "react";
import {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupStudentsQuery,
} from "../shared/api/groupApi";
import { Group } from "../shared/types/models";

const Groups = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // RTK Query хуки
  const { data: groups, isLoading, error } = useGetGroupsQuery();
  const [createGroup] = useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  // Загрузка студентов для выбранной группы
  const { data: groupStudents, isLoading: isLoadingStudents } =
    useGetGroupStudentsQuery(selectedGroupId || 0, {
      skip: !selectedGroupId,
    });



  // Обработчики событий
  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      try {
        await createGroup({ title: newGroupName });
        setNewGroupName("");
      } catch (error) {
        console.error("Error creating group:", error);
      }
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteGroup(id);
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  if (isLoading) return <div>Загрузка групп...</div>;
  if (error) return <div>Ошибка: {JSON.stringify(error)}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Группы</h1>

      {/* Форма создания группы */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Добавить новую группу</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Название группы"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleCreateGroup}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Список групп */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Список групп</h2>
          {groups && groups.length > 0 ? (
            <ul className="divide-y">
              {groups.map((group: Group) => (
                <li
                  key={group.id}
                  className="py-2 flex justify-between items-center"
                >
                  <button
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`text-left flex-1 ${
                      selectedGroupId === group.id ? "font-bold" : ""
                    }`}
                  >
                    {group.title}
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Нет доступных групп</p>
          )}
        </div>

        {/* Детали выбранной группы */}
        <div className="col-span-2 bg-gray-100 p-4 rounded">
          {selectedGroupId ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">
                Студенты группы:{" "}
                {groups?.find((g) => g.id === selectedGroupId)?.title}
              </h2>
              {isLoadingStudents ? (
                <p>Загрузка студентов...</p>
              ) : groupStudents && groupStudents.length > 0 ? (
                <ul className="divide-y">
                  {groupStudents.map((student) => (
                    <li key={student.id} className="py-2">
                      {student.fullname} - {student.phone_number}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>В этой группе нет студентов</p>
              )}
            </div>
          ) : (
            <p>Выберите группу для просмотра деталей</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Groups;
