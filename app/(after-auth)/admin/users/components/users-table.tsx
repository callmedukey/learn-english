"use client";

import { format } from "date-fns";
import React, { useState } from "react";

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
import { Country, Role } from "@/prisma/generated/prisma";

import RoleChangeDropdown from "./role-change-dropdown";
import UpdateUserForm from "./update-user-form";
import { UserData } from "../query/users.query"; // Adjust path as needed

interface UsersTableProps {
  users: UserData[];
  currentUserRole: Role;
  countries: Pick<Country, "id" | "name">[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users, currentUserRole, countries }) => {
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
          <TableHead>Nickname</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Birthday</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Subscription Status</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Referred By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <button
                type="button"
                onClick={() => handleUserClick(user)}
                className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-none p-0 font-inherit text-left"
              >
                {user.nickname || "N/A"}
              </button>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.birthday || "N/A"}</TableCell>
            <TableCell>{user.grade}</TableCell>
            <TableCell>{user.gender || "N/A"}</TableCell>
            <TableCell>{user.country?.name || "N/A"}</TableCell>
            <TableCell>
              {currentUserRole === Role.ADMIN ? (
                <RoleChangeDropdown userId={user.id} currentRole={user.role} />
              ) : (
                <span className="text-sm">{user.role}</span>
              )}
            </TableCell>
            <TableCell>
              {user.hasActiveSubscription ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  No Active Sub
                </span>
              )}
            </TableCell>
            <TableCell>
              {user.activeSubscription ? (
                <div className="text-sm">
                  <div className="font-medium">
                    {user.activeSubscription.planName}
                  </div>
                  <div className="text-gray-500">
                    ₩{user.activeSubscription.planPrice.toLocaleString()}
                  </div>
                </div>
              ) : (
                "N/A"
              )}
            </TableCell>
            <TableCell>
              {user.activeSubscription
                ? format(
                    new Date(user.activeSubscription.startDate),
                    "yyyy/MM/dd",
                  )
                : "N/A"}
            </TableCell>
            <TableCell>
              {user.activeSubscription ? (
                <div className="text-sm">
                  <div>
                    {format(
                      new Date(user.activeSubscription.endDate),
                      "yyyy/MM/dd",
                    )}
                  </div>
                  <div className="text-gray-500">
                    {new Date(user.activeSubscription.endDate) > new Date() ? (
                      <span className="text-green-600">
                        {Math.ceil(
                          (new Date(user.activeSubscription.endDate).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days left
                      </span>
                    ) : (
                      <span className="text-red-600">Expired</span>
                    )}
                  </div>
                </div>
              ) : (
                "N/A"
              )}
            </TableCell>
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
              Update the user&apos;s birthday and country information.
            </DialogDescription>
          </DialogHeader>
          <UpdateUserForm
            user={selectedUser}
            countries={countries}
            onUserUpdated={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default UsersTable;
