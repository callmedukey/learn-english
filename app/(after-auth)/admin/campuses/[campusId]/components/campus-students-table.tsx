"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, Search, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BPASeason } from "@/prisma/generated/prisma";

import AssignLevelDialog from "./assign-level-dialog";
import StudentAssignmentHistoryDialog from "./student-assignment-history-dialog";
import { bulkAssignStudentsToBPALevel } from "../actions/level-assignment.actions";
import { AssignmentHistoryRecord } from "../queries/assignment-history.query";
import { CampusStudent } from "../queries/campus-details.query";

interface CampusStudentsTableProps {
  campusId: string;
  students: CampusStudent[];
  bpaLevels: Array<{
    id: string;
    name: string;
    description: string | null;
    stars: number;
    orderNumber: number;
  }>;
  timeframes: Array<{
    id: string;
    year: number;
    startDate: Date;
    endDate: Date;
  }>;
  currentTimeframeId?: string;
  currentSeason?: BPASeason;
  adminUserId: string;
}

const SEASONS: BPASeason[] = ["SPRING", "SUMMER", "FALL", "WINTER"];

const CampusStudentsTable: React.FC<CampusStudentsTableProps> = ({
  campusId,
  students,
  bpaLevels,
  timeframes,
  currentTimeframeId,
  currentSeason,
  adminUserId,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(
    currentTimeframeId || ""
  );
  const [selectedSeason, setSelectedSeason] = useState<BPASeason | "">(
    currentSeason || ""
  );

  // Bulk assignment state (separate from filter state)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [bulkTimeframe, setBulkTimeframe] = useState<string>("");
  const [bulkSeason, setBulkSeason] = useState<BPASeason | "">("");
  const [bulkLevelId, setBulkLevelId] = useState<string>("");

  // Edit assignment state
  const [editingStudent, setEditingStudent] = useState<CampusStudent | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<CampusStudent["allAssignments"][0] | null>(null);

  // Calculate current year from timeframes
  const currentYear = useMemo(() => {
    if (timeframes.length === 0) return new Date().getFullYear();
    return Math.max(...timeframes.map((t) => t.year));
  }, [timeframes]);

  // Filter students by search query
  const filteredStudents = students.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.studentName?.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.nickname?.toLowerCase().includes(searchLower)
    );
  });

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelection = new Set(selectedStudents);
    if (checked) {
      newSelection.add(studentId);
    } else {
      newSelection.delete(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Handle bulk assignment
  const handleBulkAssign = () => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!bulkTimeframe || !bulkSeason) {
      toast.error("Please select a timeframe and season for bulk assignment");
      return;
    }

    if (!bulkLevelId) {
      toast.error("Please select a BPA level");
      return;
    }

    startTransition(async () => {
      const result = await bulkAssignStudentsToBPALevel(
        Array.from(selectedStudents),
        campusId,
        bulkTimeframe,
        bulkSeason as BPASeason,
        bulkLevelId,
        adminUserId
      );

      if (result.success) {
        // Show detailed message if available, otherwise fallback to simple message
        const message = result.message ||
          `Successfully assigned ${result.assignedCount} students to level`;
        toast.success(message);
        setSelectedStudents(new Set());
        setBulkTimeframe("");
        setBulkSeason("");
        setBulkLevelId("");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign students");
      }
    });
  };

  // Handle timeframe/season filter change
  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (selectedTimeframe) params.set("timeframeId", selectedTimeframe);
    if (selectedSeason) params.set("season", selectedSeason);

    router.push(`/admin/campuses/${campusId}?${params.toString()}`);
  };

  // Handle edit assignment click
  const handleEditAssignment = (
    student: CampusStudent,
    assignment: CampusStudent["allAssignments"][0]
  ) => {
    setEditingStudent(student);
    setEditingAssignment(assignment);
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="text-xl font-semibold">Filter & Search</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Name, email, or nickname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((timeframe) => (
                  <SelectItem key={timeframe.id} value={timeframe.id}>
                    {timeframe.year} ({format(new Date(timeframe.startDate), "MMM")}-
                    {format(new Date(timeframe.endDate), "MMM")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Season Filter */}
          <div className="space-y-2">
            <Label>Season</Label>
            <Select
              value={selectedSeason}
              onValueChange={(value) => setSelectedSeason(value as BPASeason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season.charAt(0) + season.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apply Filter Button */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              onClick={handleFilterChange}
              variant="outline"
              className="w-full"
              disabled={!selectedTimeframe || !selectedSeason}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Assignment Controls */}
      {selectedStudents.size > 0 && (
        <div className="rounded-lg border p-4 bg-blue-50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Bulk Assignment ({selectedStudents.size} selected)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Bulk Timeframe */}
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={bulkTimeframe} onValueChange={setBulkTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((timeframe) => (
                    <SelectItem key={timeframe.id} value={timeframe.id}>
                      {timeframe.year} ({format(new Date(timeframe.startDate), "MMM")}-
                      {format(new Date(timeframe.endDate), "MMM")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Season */}
            <div className="space-y-2">
              <Label>Season</Label>
              <Select
                value={bulkSeason}
                onValueChange={(value) => setBulkSeason(value as BPASeason)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season.charAt(0) + season.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Level */}
            <div className="space-y-2">
              <Label>Assign to Level</Label>
              <Select value={bulkLevelId} onValueChange={setBulkLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BPA level" />
                </SelectTrigger>
                <SelectContent>
                  {bpaLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name} ({level.stars} ⭐)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assign Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleBulkAssign}
                disabled={isPending || !bulkTimeframe || !bulkSeason || !bulkLevelId}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isPending ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredStudents.length > 0 &&
                    selectedStudents.size === filteredStudents.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-left">Actions</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nickname</TableHead>
              <TableHead>All Assignments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">
                    {searchQuery
                      ? "No students match your search"
                      : "No students in this campus"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) =>
                        handleSelectStudent(student.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-start space-x-2">
                      <StudentHistoryButton
                        studentId={student.id}
                        studentName={student.studentName || student.name || student.email}
                        campusId={campusId}
                        student={student}
                        onEditAssignment={handleEditAssignment}
                      />
                      <AssignLevelDialog
                        studentId={student.id}
                        studentName={student.studentName || student.name || student.email}
                        campusId={campusId}
                        mode="create"
                        editingAssignment={null}
                        allStudentAssignments={student.allAssignments.map((a) => ({
                          timeframeId: a.timeframeId,
                          season: a.season,
                        }))}
                        bpaLevels={bpaLevels}
                        timeframes={timeframes}
                        selectedTimeframeId={selectedTimeframe}
                        selectedSeason={selectedSeason as BPASeason}
                        adminUserId={adminUserId}
                      >
                        <Button variant="outline" size="sm">
                          Assign
                        </Button>
                      </AssignLevelDialog>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.studentName || student.name || "N/A"}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.nickname || "-"}</TableCell>
                  <TableCell>
                    {(() => {
                      const currentYearAssignments = student.allAssignments.filter(
                        (a) => a.timeframe.year === currentYear
                      );
                      const pastYearCount =
                        student.allAssignments.length - currentYearAssignments.length;

                      return (
                        <>
                          {currentYearAssignments.length === 0 ? (
                            <Badge variant="outline" className="text-gray-500">
                              No Assignments This Year
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-2 max-w-md">
                              {currentYearAssignments.map((assignment) => (
                                <AssignmentBadge
                                  key={assignment.id}
                                  assignment={assignment}
                                  student={student}
                                  onEdit={handleEditAssignment}
                                />
                              ))}
                            </div>
                          )}
                          {pastYearCount > 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              +{pastYearCount} from previous years
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Assignment Dialog - opens when badge is clicked */}
      {editingStudent && editingAssignment && (
        <EditAssignmentDialog
          student={editingStudent}
          assignment={editingAssignment}
          campusId={campusId}
          bpaLevels={bpaLevels}
          timeframes={timeframes}
          adminUserId={adminUserId}
          onClose={() => {
            setEditingStudent(null);
            setEditingAssignment(null);
          }}
        />
      )}
    </div>
  );
};

// Separate component for clickable Assignment Badge
interface AssignmentBadgeProps {
  assignment: CampusStudent["allAssignments"][0];
  student: CampusStudent;
  onEdit: (student: CampusStudent, assignment: CampusStudent["allAssignments"][0]) => void;
}

const AssignmentBadge: React.FC<AssignmentBadgeProps> = ({
  assignment,
  student,
  onEdit,
}) => {
  // Format semester dates if available
  const semesterInfo = assignment.semester
    ? `(${format(new Date(assignment.semester.startDate), "MMM d")} - ${format(new Date(assignment.semester.endDate), "MMM d")})`
    : "";

  return (
    <Badge
      variant="secondary"
      className="text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={() => onEdit(student, assignment)}
      title={semesterInfo} // Show full date range on hover
    >
      {assignment.timeframe.year}{" "}
      {assignment.season.charAt(0) + assignment.season.slice(1).toLowerCase()}:{" "}
      {assignment.bpaLevel.name}
    </Badge>
  );
};

// Separate component for Student History with React Query
interface StudentHistoryButtonProps {
  studentId: string;
  studentName: string;
  campusId: string;
  student: CampusStudent;
  onEditAssignment: (
    student: CampusStudent,
    assignment: CampusStudent["allAssignments"][0]
  ) => void;
}

const StudentHistoryButton: React.FC<StudentHistoryButtonProps> = ({
  studentId,
  studentName,
  campusId,
  student,
  onEditAssignment,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch history using React Query - only when dialog is open
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ["studentHistory", studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/campuses/${campusId}/students/${studentId}/history`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assignment history");
      }

      const data = await response.json();
      return data.history as AssignmentHistoryRecord[];
    },
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Show error toast if fetch fails
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load assignment history");
    }
  }, [error]);

  // Handle edit from history dialog
  const handleEditFromHistory = (historyRecord: AssignmentHistoryRecord) => {
    // Find the current assignment for this timeframe-season
    const currentAssignment = student.allAssignments.find(
      (a) =>
        a.timeframeId === historyRecord.timeframe.id &&
        a.season === historyRecord.season
    );

    if (currentAssignment) {
      onEditAssignment(student, currentAssignment);
      setIsOpen(false); // Close history dialog
    } else {
      toast.error("Assignment no longer exists");
    }
  };

  return (
    <StudentAssignmentHistoryDialog
      studentName={studentName}
      history={history}
      open={isOpen}
      onOpenChange={setIsOpen}
      onEditAssignment={handleEditFromHistory}
    >
      <Button variant="outline" size="sm" disabled={isLoading && isOpen}>
        <History className="mr-1 h-3 w-3" />
        {isLoading && isOpen ? "Loading..." : "History"}
      </Button>
    </StudentAssignmentHistoryDialog>
  );
};

// Wrapper component for edit dialog that controls its open state
interface EditAssignmentDialogProps {
  student: CampusStudent;
  assignment: CampusStudent["allAssignments"][0];
  campusId: string;
  bpaLevels: Array<{
    id: string;
    name: string;
    description: string | null;
    stars: number;
    orderNumber: number;
  }>;
  timeframes: Array<{
    id: string;
    year: number;
    startDate: Date;
    endDate: Date;
  }>;
  adminUserId: string;
  onClose: () => void;
}

const EditAssignmentDialog: React.FC<EditAssignmentDialogProps> = ({
  student,
  assignment,
  campusId,
  bpaLevels,
  timeframes,
  adminUserId,
  onClose,
}) => {
  return (
    <AssignLevelDialog
      studentId={student.id}
      studentName={student.studentName || student.name || student.email}
      campusId={campusId}
      mode="edit"
      editingAssignment={assignment}
      allStudentAssignments={student.allAssignments.map((a) => ({
        timeframeId: a.timeframeId,
        season: a.season,
      }))}
      bpaLevels={bpaLevels}
      timeframes={timeframes}
      adminUserId={adminUserId}
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
};

export default CampusStudentsTable;
