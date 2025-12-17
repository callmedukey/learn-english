import * as DialogPrimitive from "@rn-primitives/dialog";
import * as React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

interface DialogOverlayProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ style, children, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      style={[
        StyleSheet.absoluteFill,
        { justifyContent: "center", alignItems: "center" },
      ]}
      ref={ref}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          style,
        ]}
      />
      {children}
    </DialogPrimitive.Overlay>
  );
});
DialogOverlay.displayName = "DialogOverlay";

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  style?: ViewStyle;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ style, children, ...props }, ref) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 48, 400);

  // Convert percentage maxHeight to pixels, default to 80% of screen
  const maxHeightValue = style?.maxHeight;
  let maxHeight: number;
  if (typeof maxHeightValue === "string" && maxHeightValue.endsWith("%")) {
    const percent = parseFloat(maxHeightValue) / 100;
    maxHeight = screenHeight * percent;
  } else if (typeof maxHeightValue === "number") {
    maxHeight = maxHeightValue;
  } else {
    maxHeight = screenHeight * 0.8;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxHeight: _ignoredMaxHeight, ...restStyle } = (style || {}) as ViewStyle & { maxHeight?: unknown };

  return (
    <DialogPortal>
      <DialogOverlay>
        <DialogPrimitive.Content ref={ref} {...props}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              {
                backgroundColor: "white",
                borderRadius: 16,
                padding: 16,
                width: contentWidth,
                maxHeight: maxHeight,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                  },
                }),
              },
              restStyle,
            ]}
          >
            {children}
          </Animated.View>
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
});
DialogContent.displayName = "DialogContent";

interface DialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const DialogHeader = ({ children, style }: DialogHeaderProps) => {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {children}
    </View>
  );
};

interface DialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const DialogFooter = ({ children, style }: DialogFooterProps) => {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 16,
          gap: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
}

const DialogTitle = ({ children }: DialogTitleProps) => {
  return (
    <View>
      {children}
    </View>
  );
};

interface DialogDescriptionProps {
  children: React.ReactNode;
}

const DialogDescription = ({ children }: DialogDescriptionProps) => {
  return (
    <View style={{ marginTop: 4 }}>
      {children}
    </View>
  );
};

// Close button component for the X in the corner
interface DialogCloseButtonProps {
  onPress?: () => void;
}

const DialogCloseButton = ({ onPress }: DialogCloseButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "#f5f5f5",
        zIndex: 10,
      }}
      hitSlop={8}
    >
      <View
        style={{
          width: 14,
          height: 14,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 14,
            height: 2,
            backgroundColor: "#737373",
            transform: [{ rotate: "45deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 14,
            height: 2,
            backgroundColor: "#737373",
            transform: [{ rotate: "-45deg" }],
          }}
        />
      </View>
    </Pressable>
  );
};

export {
  Dialog,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
