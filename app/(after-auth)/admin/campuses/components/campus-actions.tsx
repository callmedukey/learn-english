"use client";

import React from "react";

import { Button } from "@/components/ui/button";

import DeleteCampusDialog from "./delete-campus-dialog";
import UpdateCampusDialog from "./update-campus-dialog";

type Campus = {
  id: string;
  name: string;
  _count: {
    users: number;
  };
};

interface CampusActionsProps {
  campus: Campus;
}

const CampusActions: React.FC<CampusActionsProps> = ({ campus }) => {
  return (
    <>
      <UpdateCampusDialog campus={campus}>
        <Button variant="outline" size="sm">
          Update
        </Button>
      </UpdateCampusDialog>
      <DeleteCampusDialog
        campusId={campus.id}
        campusName={campus.name}
        userCount={campus._count.users}
      >
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DeleteCampusDialog>
    </>
  );
};

export default CampusActions;
