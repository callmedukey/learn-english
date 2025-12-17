import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

interface HtmlContentProps {
  html: string;
  baseStyle?: object;
}

const TAGS_STYLES = {
  p: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    fontWeight: "700" as const,
  },
  em: {
    fontStyle: "italic" as const,
  },
  ul: {
    marginBottom: 8,
    paddingLeft: 20,
  },
  ol: {
    marginBottom: 8,
    paddingLeft: 20,
  },
  li: {
    marginBottom: 4,
  },
};

export function HtmlContent({ html, baseStyle }: HtmlContentProps) {
  const { width } = useWindowDimensions();

  // Memoize the merged base style to prevent unnecessary re-renders
  const mergedBaseStyle = useMemo(
    () => ({
      color: "#1F2937", // text-foreground
      fontSize: 16,
      lineHeight: 24,
      ...baseStyle,
    }),
    [baseStyle]
  );

  // Clean up the HTML if needed
  const cleanHtml = html?.trim() || "";

  if (!cleanHtml) {
    return null;
  }

  return (
    <RenderHtml
      contentWidth={width - 32} // Account for padding
      source={{ html: cleanHtml }}
      baseStyle={mergedBaseStyle}
      tagsStyles={TAGS_STYLES}
    />
  );
}
