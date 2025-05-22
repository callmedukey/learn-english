import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming you have these shadcn/ui components

import { UserData } from "../actions/users.admin-actions"; // Adjust path as needed

interface UsersTableProps {
  users: UserData[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500">No users found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nickname</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Birthday</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Referred By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.nickname || "N/A"}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.birthday || "N/A"}</TableCell>
            <TableCell>{user.grade}</TableCell>
            <TableCell>{user.gender || "N/A"}</TableCell>
            <TableCell>{user.country || "N/A"}</TableCell>
            <TableCell>
              {user.isReferred
                ? user.referrerNickname || "N/A (Referred)"
                : "Not Referred"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UsersTable;
