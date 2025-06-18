import { Group } from "@/shared/types/models";

export interface EditGroupModalProps {
  open: boolean;
  group?: Group;
  onClose: () => void;
  onSuccess?: () => void;
}
