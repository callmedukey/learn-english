"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUserDetailsAction } from "@/actions/admin-users.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import DayPicker from "@/components/custom-ui/day-picker";
import SelectWithLabel from "@/components/custom-ui/select-with-label";
import { DialogFooter } from "@/components/ui/dialog";
import { Country } from "@/prisma/generated/prisma";
import { ActionResponse } from "@/types/actions";

import { UserData } from "../query/users.query";

interface UpdateUserFormProps {
  user: UserData;
  countries: Pick<Country, "id" | "name">[];
  onUserUpdated: () => void;
}

const initialState: ActionResponse<any> = {
  success: false,
  message: "",
};

export default function UpdateUserForm({
  user,
  countries,
  onUserUpdated,
}: UpdateUserFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    user.birthday ? new Date(user.birthday) : undefined,
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(
    user.country?.id || "",
  );
  const [state, formAction] = useActionState(updateUserDetailsAction, initialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!date && !selectedCountry) {
      toast.error("Please select at least one field to update");
      return;
    }

    const updateData = {
      userId: user.id,
      ...(date && { birthday: date.toISOString() }),
      ...(selectedCountry && { countryId: selectedCountry }),
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