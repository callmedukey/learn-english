import { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={`h-12 rounded-lg border border-input bg-white px-4 text-foreground ${className}`}
        style={[
          {
            fontSize: 16,
            paddingVertical: 0,
            paddingTop: 0,
            paddingBottom: 0,
            lineHeight: 20,
            includeFontPadding: false,
          },
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        textAlignVertical="center"
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
