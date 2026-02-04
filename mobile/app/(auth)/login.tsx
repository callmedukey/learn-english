import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { z } from "zod";

import { Input } from "@/components/ui";

import { useAuth } from "@/hooks/useAuth";

const logo = require("@/assets/images/logo.png");

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(data.email, data.password);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { error?: string } };
        code?: string;
      };

      // User-friendly error messages
      if (axiosError.code === "ERR_NETWORK") {
        setError(
          "Unable to connect. Please check your internet connection and try again."
        );
      } else if (axiosError.response?.status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (axiosError.response?.status === 400) {
        setError("Please enter a valid email and password.");
      } else if (axiosError.response?.status === 429) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1 bg-background"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo */}
          <View className="mb-8 items-center">
            <Image
              source={logo}
              className="h-40 w-40"
              resizeMode="contain"
            />
            <Text className="mt-4 text-center text-muted-foreground">
              Login to continue your learning journey
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 rounded-lg bg-red-50 p-3">
              <Text className="text-center text-destructive">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            {/* Email Field */}
            <View>
              <Text className="mb-2 text-base text-muted-foreground">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View>
              <Text className="mb-2 text-base text-muted-foreground">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Enter your password"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <View className="flex-row justify-end">
              <Link href="/forgot-password" asChild>
                <TouchableOpacity>
                  <Text className="text-sm text-muted-foreground">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className={`mt-2 rounded-lg bg-primary py-4 ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#F9F5F0" />
              ) : (
                <Text className="text-center text-base font-semibold text-primary-foreground">
                  Login
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-muted-foreground">
              Don&apos;t have an account?
            </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-semibold text-foreground underline">
                  Sign up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Copyright */}
          <Text className="mt-8 text-center text-sm text-muted-foreground">
            © 2025 Reading Champ. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
