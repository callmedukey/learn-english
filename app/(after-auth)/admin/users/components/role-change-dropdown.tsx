"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/prisma/generated/prisma";

import { changeUserRole } from "../actions/change-user-role";

interface RoleChangeDropdownProps {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
}

export default function RoleChangeDropdown({
  userId,
  currentRole,
  disabled = false,
}: RoleChangeDropdownProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;

    setIsChanging(true);
    try {
      await changeUserRole(userId, newRole as Role);
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Select
      value={currentRole}
      onValueChange={handleRoleChange}
      disabled={disabled || isChanging}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Role.USER}>User</SelectItem>
        <SelectItem value={Role.SUB_ADMIN}>Sub Admin</SelectItem>
        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}