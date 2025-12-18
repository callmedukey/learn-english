import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { apiClient } from "@/services/api/client";

interface UserSettings {
  nickname: string;
  email: string;
  gender: string | null;
  birthday: string | null;
  hasCredentials: boolean; // Whether user signed up with email/password
}

interface SettingsFormProps {
  initialSettings: UserSettings;
  onUpdate?: () => void;
}

export function SettingsForm({ initialSettings, onUpdate }: SettingsFormProps) {
  const [nickname, setNickname] = useState(initialSettings.nickname);
  const [gender, setGender] = useState(initialSettings.gender);
  const [birthday, setBirthday] = useState<Date | null>(
    initialSettings.birthday ? new Date(initialSettings.birthday) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canEditGender =
    !initialSettings.gender || initialSettings.gender === "Other";
  const canEditBirthday = !initialSettings.birthday;

  const validateNickname = (value: string): boolean => {
    const regex = /^[a-z0-9]{3,8}$/;
    if (!regex.test(value)) {
      setErrors((prev) => ({
        ...prev,
        nickname: "닉네임은 3-8자의 소문자와 숫자만 가능합니다",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, nickname: "" }));
    return true;
  };

  const handleNicknameSubmit = async () => {
    if (!validateNickname(nickname)) return;
    if (nickname === initialSettings.nickname) return;

    try {
      setIsLoading(true);
      await apiClient.patch("/api/mobile/user/nickname", { nickname });
      Alert.alert("성공", "닉네임이 변경되었습니다.");
      onUpdate?.();
    } catch (error: any) {
      Alert.alert(
        "오류",
        error.response?.data?.error || "닉네임 변경에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenderChange = async (newGender: string) => {
    if (!canEditGender) return;
    if (newGender === gender) return;

    try {
      setIsLoading(true);
      await apiClient.patch("/api/mobile/user/gender", { gender: newGender });
      setGender(newGender);
      Alert.alert("성공", "성별이 변경되었습니다.");
      onUpdate?.();
    } catch (error: any) {
      Alert.alert(
        "오류",
        error.response?.data?.error || "성별 변경에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirthdayChange = async (date: Date) => {
    if (!canEditBirthday) return;

    try {
      setIsLoading(true);
      await apiClient.patch("/api/mobile/user/birthday", {
        birthday: date.toISOString(),
      });
      setBirthday(date);
      Alert.alert("성공", "생년월일이 설정되었습니다.");
      onUpdate?.();
    } catch (error: any) {
      Alert.alert(
        "오류",
        error.response?.data?.error || "생년월일 변경에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
      setShowDatePicker(false);
    }
  };

  const formatBirthday = (date: Date | null) => {
    if (!date) return "설정되지 않음";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View className="gap-6">
      {/* Nickname */}
      <View>
        <Text className="mb-2 text-sm font-medium text-foreground">닉네임</Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-foreground"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text.toLowerCase());
              validateNickname(text.toLowerCase());
            }}
            placeholder="닉네임 입력"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={8}
          />
          <TouchableOpacity
            className="rounded-lg bg-primary px-4 py-3"
            onPress={handleNicknameSubmit}
            disabled={isLoading || nickname === initialSettings.nickname}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-medium text-white">저장</Text>
            )}
          </TouchableOpacity>
        </View>
        {errors.nickname && (
          <Text className="mt-1 text-xs text-red-500">{errors.nickname}</Text>
        )}
        <Text className="mt-1 text-xs text-muted-foreground">
          3-8자의 영문 소문자와 숫자만 사용 가능
        </Text>
      </View>

      {/* Email (Read Only) */}
      <View>
        <Text className="mb-2 text-sm font-medium text-foreground">이메일</Text>
        <View className="flex-row items-center rounded-lg border border-border bg-muted px-4 py-3">
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <Text className="ml-2 text-muted-foreground">
            {initialSettings.email}
          </Text>
        </View>
      </View>

      {/* Gender */}
      <View>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">성별</Text>
          {!canEditGender && (
            <Text className="text-xs text-muted-foreground">변경 불가</Text>
          )}
        </View>
        <View className="flex-row gap-2">
          {["Male", "Female", "Other"].map((option) => (
            <TouchableOpacity
              key={option}
              className={`flex-1 items-center rounded-lg border py-3 ${
                gender === option
                  ? "border-primary bg-primary/10"
                  : "border-border bg-white"
              } ${!canEditGender ? "opacity-50" : ""}`}
              onPress={() => handleGenderChange(option)}
              disabled={!canEditGender || isLoading}
            >
              <Text
                className={`font-medium ${
                  gender === option ? "text-primary" : "text-foreground"
                }`}
              >
                {option === "Male"
                  ? "남성"
                  : option === "Female"
                  ? "여성"
                  : "기타"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Birthday */}
      <View>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">생년월일</Text>
          {!canEditBirthday && (
            <Text className="text-xs text-muted-foreground">
              한 번만 설정 가능
            </Text>
          )}
        </View>
        <TouchableOpacity
          className={`flex-row items-center justify-between rounded-lg border border-border bg-white px-4 py-3 ${
            !canEditBirthday ? "opacity-50" : ""
          }`}
          onPress={() => canEditBirthday && setShowDatePicker(true)}
          disabled={!canEditBirthday || isLoading}
        >
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text className="ml-2 text-foreground">
              {formatBirthday(birthday)}
            </Text>
          </View>
          {canEditBirthday && (
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          )}
        </TouchableOpacity>
        {canEditBirthday && (
          <Text className="mt-1 text-xs text-amber-600">
            ⚠️ 생년월일은 한 번 설정하면 변경할 수 없습니다
          </Text>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <>
            {Platform.OS === "ios" ? (
              <View className="mt-2 rounded-lg bg-white p-2">
                <DateTimePicker
                  value={birthday || new Date(2010, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (event.type === "dismissed") {
                      setShowDatePicker(false);
                    } else if (selectedDate) {
                      handleBirthdayChange(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1950, 0, 1)}
                />
                <View className="flex-row justify-end gap-2 px-2 pb-2">
                  <TouchableOpacity
                    className="rounded-lg px-4 py-2"
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text className="text-muted-foreground">취소</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <DateTimePicker
                value={birthday || new Date(2010, 0, 1)}
                mode="date"
                display="default"
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (event.type !== "dismissed" && selectedDate) {
                    handleBirthdayChange(selectedDate);
                  }
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1950, 0, 1)}
              />
            )}
          </>
        )}
      </View>

      {/* Password Change Link */}
      {initialSettings.hasCredentials && (
        <View>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg border border-border bg-white px-4 py-4"
            onPress={() => {
              Alert.alert(
                "비밀번호 변경",
                "비밀번호 변경은 웹사이트에서 가능합니다."
              );
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={20} color="#5D3A29" />
              <Text className="ml-3 font-medium text-foreground">
                비밀번호 변경
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
