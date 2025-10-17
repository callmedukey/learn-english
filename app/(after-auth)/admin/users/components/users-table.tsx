"use client";

import React, { useState } from "react";

import ScoreLogDialog from "@/app/(after-auth)/admin/components/score-log-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming you have these shadcn/ui components
import { Campus, Country, Role } from "@/prisma/generated/prisma";

import RoleChangeDropdown from "./role-change-dropdown";
import UpdateUserForm from "./update-user-form";
import { UserData } from "../query/users.query"; // Adjust path as needed

interface UsersTableProps {
  users: UserData[];
  currentUserRole: Role;
  countries: Pick<Country, "id" | "name">[];
  campuses: Pick<Campus, "id" | "name">[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users, currentUserRole, countries, campuses }) => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500">No users found.</p>;
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Actions</TableHead>
          <TableHead>Nickname</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Campus</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Birthday</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Parent Name</TableHead>
          <TableHead>Parent Phone</TableHead>
          <TableHead>Student Phone</TableHead>
          <TableHead>Subscription Status</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Referred By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="text-left">
              <ScoreLogDialog
                userId={user.id}
                userNickname={user.nickname || user.name || "Anonymous"}
              />
            </TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => handleUserClick(user)}
                className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none p-0 font-inherit text-left"
              >
                {user.nickname || "N/A"}
              </button>
            </TableCell>
            <TableCell>{user.studentName || "N/A"}</TableCell>
            <TableCell>{user.campus?.name || "N/A"}</TableCell>
            <TableCell>{user.grade}</TableCell>
            <TableCell>{user.birthday || "N/A"}</TableCell>
            <TableCell>
              {currentUserRole === Role.ADMIN ? (
                <RoleChangeDropdown userId={user.id} currentRole={user.role} />
              ) : (
                <span className="text-base">{user.role}</span>
              )}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.parentName || "N/A"}</TableCell>
            <TableCell>{user.parentPhone || "N/A"}</TableCell>
            <TableCell>{user.studentPhone || "N/A"}</TableCell>
            <TableCell>
              {user.hasActiveSubscription ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                  No Active Sub
                </span>
              )}
            </TableCell>
            <TableCell>{user.gender || "N/A"}</TableCell>
            <TableCell>
              {user.isReferred
                ? user.referrerNickname || "N/A (Referred)"
                : "Not Referred"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {selectedUser && (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update User: {selectedUser.nickname}</DialogTitle>
            <DialogDescription>
              Update the user&apos;s information including nickname, birthday, country, and contact details.
            </DialogDescription>
          </DialogHeader>
          <UpdateUserForm
            user={selectedUser}
            countries={countries}
            campuses={campuses}
            onUserUpdated={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default UsersTable;
