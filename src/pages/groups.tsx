import { useState, useMemo } from "react";
import VirtualList from "rc-virtual-list";
import { Button, Flex, Space, Input, Modal, List, Avatar } from "antd";
import { TeamOutlined } from "@ant-design/icons";

import { GroupTable } from "@/widgets/group-table";
import {
  useGetGroupsQuery,
  useDeleteGroupMutation,
  useGetGroupStudentsQuery,
} from "@/shared/api/groupApi";
import { GroupFormModal } from "@/features/group/group-form-modal";
import type { Group, Student } from "@/shared/types/models";

const Groups = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openStudentsModal, setOpenStudentsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>();
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [searchQuery, setSearchQuery] = useState("");

  // RTK Query хуки
  const {
    data: groups,
    isLoading,
    error,
  } = useGetGroupsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteGroup] = useDeleteGroupMutation();

  // Загрузка студентов для выбранной группы
  const { data: groupStudents, isLoading: isLoadingStudents } =
    useGetGroupStudentsQuery(selectedGroup?.id || 0, {
      skip: !selectedGroup,
      refetchOnMountOrArgChange: true,
    });

  // Фильтрация групп на основе поискового запроса
  const filteredGroups = useMemo(() => {
    if (!groups || !searchQuery.trim()) {
      return groups;
    }

    const query = searchQuery.toLowerCase().trim();
    return groups.filter((group) => {
      return group.title.toLowerCase().includes(query);
    });
  }, [groups, searchQuery]);

  const handleCreateGroup = () => {
    setSelectedGroup(undefined);
    setModalMode("create");
    setOpenModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setModalMode("edit");
    setOpenModal(true);
  };

  const handleViewStudents = (group: Group) => {
    setSelectedGroup(group);
    setOpenStudentsModal(true);
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteGroup(id);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  if (isLoading) return <div>Loading groups...</div>;
  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  return (
    <Space
      direction="vertical"
      style={{ width: "100%", padding: "16px", display: "flex" }}
      size="large"
    >
      <GroupFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => setOpenModal(false)}
        group={selectedGroup}
        mode={modalMode}
      />

      {/* Модальное окно для просмотра студентов группы */}
      <Modal
        title={`Students in group: ${selectedGroup?.title || ""}`}
        open={openStudentsModal}
        onCancel={() => setOpenStudentsModal(false)}
        footer={null}
        width={600}
      >
        {isLoadingStudents ? (
          <div>Loading students...</div>
        ) : (
          <List locale={{ emptyText: "No students in this group" }}>
            <VirtualList
              itemKey="id"
              itemHeight={47}
              data={groupStudents || []}
              height={Math.min(500, window.innerHeight - 200)}
            >
              {(student: Student) => (
                <List.Item key={student.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TeamOutlined />} />}
                    title={student.fullname}
                    description={`Phone: ${
                      student.phone_number || "N/A"
                    }, Payment Due: ${student.payment_due || "0"}`}
                  />
                </List.Item>
              )}
            </VirtualList>
          </List>
        )}
      </Modal>

      <Flex justify="space-between" align="center" gap={16}>
        <Input.Search
          placeholder="Search groups by title"
          allowClear
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="primary" onClick={handleCreateGroup}>
          Create Group
        </Button>
      </Flex>

      <GroupTable
        data={filteredGroups ?? []}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
        onViewStudents={handleViewStudents}
      />
    </Space>
  );
};

export default Groups;
