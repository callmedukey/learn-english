import { Link } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";

export default function ForgotPasswordScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-2 text-2xl text-foreground">Reset Password</Text>
      <Text className="mb-8 text-center text-muted-foreground">
        Password reset screen coming soon...
      </Text>
      <Link href="/login" asChild>
        <TouchableOpacity
          className="rounded-lg bg-primary px-6 py-3"
          activeOpacity={0.8}
        >
          <Text className="font-semibold text-primary-foreground">
            Back to Login
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
