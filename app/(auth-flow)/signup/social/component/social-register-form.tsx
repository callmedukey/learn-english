"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { socialSignUpAction } from "@/actions/auth.action";
import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
import CheckboxWithLabel from "@/components/custom-ui/checkbox-with-label";
import DayPicker from "@/components/custom-ui/day-picker";
import InputWithLabel from "@/components/custom-ui/input-with-label";
import SelectWithLabel from "@/components/custom-ui/select-with-label";
import BirthdayConfirmationDialog from "@/components/dialogs/birthday-confirmation-dialog";
import { SignUpType } from "@/lib/schemas/auth.schema";
import { Country } from "@/prisma/generated/prisma";
import { ActionResponse } from "@/types/actions";

interface SocialRegisterFormProps {
  email: string;
  countries: Pick<Country, "id" | "name">[];
}

const initialState: ActionResponse<SignUpType> = {
  success: false,
  message: "",
};

const SocialRegisterForm = ({ email, countries }: SocialRegisterFormProps) => {
  const [date, setDate] = useState<Date | undefined>();
  const [state, action] = useActionState(socialSignUpAction, initialState);
  const [transitionIsPending, startTransition] = useTransition();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(
    null
  );
  const router = useRouter();

  const handleFormSubmit = (formData: FormData) => {
    startTransition(() => {
      action(formData);
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    formData.append("email", email);
    formData.append("birthday", date?.toISOString() || "");

    // Check if birthday is before 2006 and country is selected
    if (date && selectedCountry) {
      const birthYear = date.getFullYear();
      if (birthYear < 2006) {
        setPendingFormData(formData);
        setShowBirthdayDialog(true);
        return;
      }
    }

    handleFormSubmit(formData);
  };

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.push("/");
    }
  }, [state, router]);

  return (
    <form className="w-full max-w-md space-y-4" onSubmit={onSubmit}>
      <h2 className="text-center text-2xl">Finish Sign Up</h2>
      <p className="mt-2 text-center text-gray-500">
        Please fill in the following information to finish signing up.
      </p>
      <fieldset className="*:mt-4">
        <InputWithLabel
          label="Email"
          name="email"
          type="email"
          disabled
          defaultValue={email}
          error={state.errors?.email?.[0]}
        />
        <InputWithLabel
          label="Nickname"
          name="nickname"
          type="text"
          required
          defaultValue={state.inputs?.nickname}
          minLength={3}
          maxLength={8}
          placeholder="Enter your nickname"
          description="This will be visible to other users. Please choose carefully."
          error={state.errors?.nickname?.[0]}
        />

        <SelectWithLabel
          label="Gender"
          hint="Optional"
          placeholder="Select your gender"
          defaultValue={state.inputs?.gender}
          error={state.errors?.gender?.[0]}
          items={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
          ]}
        />
        <DayPicker
          label="Birthday"
          date={date}
          setDate={setDate}
          placeholder="Select your birthday"
          error={
            state.errors?.birthday?.[0] === "Invalid date"
              ? "Please select your birthday"
              : state.errors?.birthday?.[0]
          }
        />
        <SelectWithLabel
          label="Country"
          name="country"
          required
          defaultValue={state.inputs?.country}
          placeholder="Select your country"
          error={state.errors?.country?.[0]}
          onValueChange={setSelectedCountry}
          items={countries.map((country) => ({
            label: country.name,
            value: country.id,
          }))}
        />
        <InputWithLabel
          label="Referrer"
          name="referrer"
          type="text"
          minLength={3}
          maxLength={8}
          defaultValue={state.inputs?.referrer}
          placeholder="Enter your referrer's nickname"
          error={state.errors?.referrer?.[0]}
        />
      </fieldset>
      <CheckboxWithLabel
        label="I agree to the terms and conditions"
        name="terms"
        defaultChecked={!!state.inputs?.terms}
        error={state.errors?.terms?.[0]}
      />
      <ButtonWithLoading
        type="submit"
        className="w-full"
        isLoading={transitionIsPending}
        disabled={transitionIsPending}
      >
        Continue
      </ButtonWithLoading>
      <p className="text-center text-sm text-gray-500">
        © 2025 Reading Champ. All rights reserved.
      </p>
      <BirthdayConfirmationDialog
        open={showBirthdayDialog}
        isKorea={
          countries.find((c) => c.id === selectedCountry)?.name ===
          "South Korea"
        }
        onConfirm={() => {
          setShowBirthdayDialog(false);
          if (pendingFormData) {
            handleFormSubmit(pendingFormData);
            setPendingFormData(null);
          }
        }}
        onCancel={() => {
          setShowBirthdayDialog(false);
          setPendingFormData(null);
        }}
      />
    </form>
  );
};

export default SocialRegisterForm;
