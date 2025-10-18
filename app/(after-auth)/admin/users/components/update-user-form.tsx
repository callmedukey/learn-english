"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUserDetailsAction } from "@/actions/admin-users.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import DayPicker from "@/components/custom-ui/day-picker";
import InputWithLabel from "@/components/custom-ui/input-with-label";
import SelectWithLabel from "@/components/custom-ui/select-with-label";
import { DialogFooter } from "@/components/ui/dialog";
import { Campus, Country } from "@/prisma/generated/prisma";
import { ActionResponse } from "@/types/actions";

import { UserData } from "../query/users.query";

interface UpdateUserFormProps {
  user: UserData;
  countries: Pick<Country, "id" | "name">[];
  campuses: Pick<Campus, "id" | "name">[];
  onUserUpdated: () => void;
}

const initialState: ActionResponse<any> = {
  success: false,
  message: "",
};

export default function UpdateUserForm({
  user,
  countries,
  campuses,
  onUserUpdated,
}: UpdateUserFormProps) {
  const [nickname, setNickname] = useState<string>(user.nickname || "");
  const [date, setDate] = useState<Date | undefined>(
    user.birthday ? new Date(user.birthday) : undefined,
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(
    user.country?.id || "",
  );
  const [selectedCampus, setSelectedCampus] = useState<string>(
    user.campus?.id || "",
  );
  const [parentName, setParentName] = useState<string>(user.parentName || "");
  const [parentPhone, setParentPhone] = useState<string>(user.parentPhone || "");
  const [studentName, setStudentName] = useState<string>(user.studentName || "");
  const [studentPhone, setStudentPhone] = useState<string>(user.studentPhone || "");
  const [state, formAction] = useActionState(updateUserDetailsAction, initialState);
  const [isPending, startTransition] = useTransition();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");

    // Format as 010-0000-0000
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string, setter: (value: string) => void) => {
    const formatted = formatPhoneNumber(value);
    setter(formatted);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updateData = {
      userId: user.id,
      nickname: nickname || undefined,
      ...(date && { birthday: date.toISOString() }),
      ...(selectedCountry && { countryId: selectedCountry }),
      campusId: selectedCampus || undefined,
      parentName: parentName || undefined,
      parentPhone: parentPhone || undefined,
      studentName: studentName || undefined,
      studentPhone: studentPhone || undefined,
    };

    startTransition(() => {
      formAction(updateData);
    });
  };

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onUserUpdated();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onUserUpdated]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputWithLabel
        label="Nickname"
        name="nickname"
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value.toLowerCase())}
        placeholder="Enter nickname (3-8 characters, lowercase and numbers)"
        error={state.errors?.nickname?.[0]}
      />

      <DayPicker
        label="Birthday"
        date={date}
        setDate={setDate}
        placeholder="Select birthday"
        error={state.errors?.birthday?.[0]}
      />

      <SelectWithLabel
        label="Country"
        placeholder="Select country"
        value={selectedCountry}
        onValueChange={setSelectedCountry}
        error={state.errors?.countryId?.[0]}
        items={countries.map((country) => ({
          label: country.name,
          value: country.id,
        }))}
      />

      <div className="space-y-2">
        <SelectWithLabel
          label="Campus"
          hint="Optional"
          placeholder="Select campus"
          value={selectedCampus}
          onValueChange={setSelectedCampus}
          error={state.errors?.campusId?.[0]}
          items={campuses.map((campus) => ({
            label: campus.name,
            value: campus.id,
          }))}
        />
        {selectedCampus && (
          <button
            type="button"
            onClick={() => setSelectedCampus("")}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Remove campus assignment
          </button>
        )}
      </div>

      <InputWithLabel
        label="Parent Name (학부모 이름)"
        name="parentName"
        type="text"
        value={parentName}
        onChange={(e) => setParentName(e.target.value)}
        placeholder="Enter parent name"
        error={state.errors?.parentName?.[0]}
      />

      <InputWithLabel
        label="Parent Phone (학부모 전화번호)"
        name="parentPhone"
        type="tel"
        value={parentPhone}
        onChange={(e) => handlePhoneChange(e.target.value, setParentPhone)}
        placeholder="010-1234-5678"
        error={state.errors?.parentPhone?.[0]}
      />

      <InputWithLabel
        label="Student Name (학생 이름)"
        name="studentName"
        type="text"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        placeholder="Enter student name"
        error={state.errors?.studentName?.[0]}
      />

      <InputWithLabel
        label="Student Phone (학생 전화번호)"
        name="studentPhone"
        type="tel"
        value={studentPhone}
        onChange={(e) => handlePhoneChange(e.target.value, setStudentPhone)}
        placeholder="010-1234-5678"
        error={state.errors?.studentPhone?.[0]}
      />

      <DialogFooter>
        <ButtonWithLoading
          type="submit"
          isLoading={isPending}
          disabled={isPending}
        >
          Update User
        </ButtonWithLoading>
      </DialogFooter>
    </form>
  );
}