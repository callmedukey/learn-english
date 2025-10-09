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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignUpType } from "@/lib/schemas/auth.schema";
import { Campus, Country } from "@/prisma/generated/prisma";
import { ActionResponse } from "@/types/actions";

interface SocialRegisterFormProps {
  email: string;
  countries: Pick<Country, "id" | "name">[];
  campuses: Pick<Campus, "id" | "name">[];
}

const initialState: ActionResponse<SignUpType> = {
  success: false,
  message: "",
};

const SocialRegisterForm = ({ email, countries, campuses }: SocialRegisterFormProps) => {
  const [date, setDate] = useState<Date | undefined>();
  const [state, action] = useActionState(socialSignUpAction, initialState);
  const [transitionIsPending, startTransition] = useTransition();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(
    null
  );
  const [parentPhone, setParentPhone] = useState<string>("");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [ageVerified, setAgeVerified] = useState<string>("");
  const router = useRouter();

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
        {selectedCountry &&
          countries.find((c) => c.id === selectedCountry)?.name ===
            "South Korea" && (
            <>
              <SelectWithLabel
                label="Campus"
                name="campus"
                hint="Optional"
                placeholder="Select your campus"
                value={selectedCampus}
                onValueChange={setSelectedCampus}
                error={state.errors?.campus?.[0]}
                description="Your campus request will be reviewed by an administrator before being approved."
                items={campuses.map((campus) => ({
                  label: campus.name,
                  value: campus.id,
                }))}
              />
              <InputWithLabel
                label="학부모 이름"
                name="parentName"
                type="text"
                defaultValue={state.inputs?.parentName}
                placeholder="학부모 이름을 입력하세요"
                error={state.errors?.parentName?.[0]}
              />
              <InputWithLabel
                label="학부모 전화번호"
                name="parentPhone"
                type="tel"
                value={parentPhone}
                onChange={(e) => handlePhoneChange(e.target.value, setParentPhone)}
                placeholder="010-1234-5678"
                error={state.errors?.parentPhone?.[0]}
              />
              <InputWithLabel
                label="학생 이름"
                name="studentName"
                type="text"
                defaultValue={state.inputs?.studentName}
                placeholder="학생 이름을 입력하세요"
                error={state.errors?.studentName?.[0]}
              />
              <InputWithLabel
                label="학생 전화번호"
                name="studentPhone"
                type="tel"
                value={studentPhone}
                onChange={(e) => handlePhoneChange(e.target.value, setStudentPhone)}
                placeholder="010-1234-5678"
                error={state.errors?.studentPhone?.[0]}
              />
            </>
          )}
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

      {/* Korean Consent Checkboxes */}
      {selectedCountry &&
        countries.find((c) => c.id === selectedCountry)?.name ===
          "South Korea" && (
          <div className="space-y-6 rounded-lg border border-gray-200 bg-gray-50/50 p-6">
            <div className="space-y-4">
              <div className="pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">필수 동의</h3>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="termsAgreed"
                  name="termsAgreed"
                  defaultChecked={!!state.inputs?.termsAgreed}
                />
                <Label htmlFor="termsAgreed" className="leading-normal cursor-pointer">
                  (필수) 이용약관에 동의합니다.
                </Label>
                {/* Hidden input for the main terms field */}
                <input type="hidden" name="terms" value="on" />
              </div>
              {state.errors?.termsAgreed?.[0] && (
                <p className="text-sm text-red-500 ml-7">
                  {state.errors.termsAgreed[0]}
                </p>
              )}

              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacyAgreed"
                  name="privacyAgreed"
                  defaultChecked={!!state.inputs?.privacyAgreed}
                />
                <Label htmlFor="privacyAgreed" className="leading-normal cursor-pointer">
                  (필수) 개인정보 수집 및 이용에 동의합니다.
                </Label>
              </div>
              {state.errors?.privacyAgreed?.[0] && (
                <p className="text-sm text-red-500 ml-7">
                  {state.errors.privacyAgreed[0]}
                </p>
              )}

              <div className="space-y-3">
                <RadioGroup
                  value={ageVerified}
                  onValueChange={setAgeVerified}
                  name="ageVerified"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="14_or_older" id="age-14-or-older" />
                    <Label htmlFor="age-14-or-older" className="leading-normal cursor-pointer">
                      (필수) 만 14세 이상입니다
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="under_14_with_consent" id="age-under-14" />
                    <Label htmlFor="age-under-14" className="leading-normal cursor-pointer">
                      (필수) 만 14세 미만이며 법정대리인의 동의를 받았습니다
                    </Label>
                  </div>
                </RadioGroup>
                {state.errors?.ageVerified?.[0] && (
                  <p className="text-sm text-red-500 ml-7">
                    {state.errors.ageVerified[0]}
                  </p>
                )}
              </div>

              {ageVerified === "under_14_with_consent" && (
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="guardianPrivacyAgreed"
                    name="guardianPrivacyAgreed"
                    defaultChecked={!!state.inputs?.guardianPrivacyAgreed}
                  />
                  <Label htmlFor="guardianPrivacyAgreed" className="leading-normal cursor-pointer">
                    (필수, 만 14세 미만만 해당) 법정대리인(보호자)의 개인정보 수집 및 이용에 동의합니다.
                  </Label>
                </div>
              )}
              {state.errors?.guardianPrivacyAgreed?.[0] && (
                <p className="text-sm text-red-500 ml-7">
                  {state.errors.guardianPrivacyAgreed[0]}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">선택 동의</h3>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketingAgreed"
                  name="marketingAgreed"
                  defaultChecked={!!state.inputs?.marketingAgreed}
                />
                <Label htmlFor="marketingAgreed" className="leading-normal cursor-pointer">
                  (선택) 맞춤형 서비스 제공을 위한 개인정보 활용에 동의합니다.
                </Label>
              </div>
            </div>
          </div>
        )}

      {/* Only show English terms checkbox if not South Korea */}
      {!(selectedCountry &&
        countries.find((c) => c.id === selectedCountry)?.name ===
          "South Korea") && (
        <CheckboxWithLabel
          label="I agree to the terms and conditions"
          name="terms"
          defaultChecked={!!state.inputs?.terms}
          error={state.errors?.terms?.[0]}
        />
      )}
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
