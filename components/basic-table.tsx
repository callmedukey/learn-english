import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface User {
  id: string;
  nickname: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  country: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users }: UserTableProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nickname</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nickname}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.gender}</TableCell>
              <TableCell>{user.country}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
