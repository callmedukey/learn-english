import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryText?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please check your connection and try again",
  onRetry,
  isRetrying = false,
  retryText = "Try Again",
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <FontAwesome name="exclamation-circle" size={48} color="#EF4444" />
      <Text className="mt-4 text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mt-2 text-center text-muted-foreground">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="mt-6 flex-row items-center rounded-lg bg-primary px-6 py-3"
          onPress={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome name="refresh" size={16} color="#FFFFFF" />
              <Text className="ml-2 font-semibold text-white">{retryText}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
