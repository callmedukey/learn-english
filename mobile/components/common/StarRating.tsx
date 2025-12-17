import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View } from "react-native";

interface StarRatingProps {
  stars: number;
  size?: number;
  filledColor?: string;
  emptyColor?: string;
}

export function StarRating({
  stars,
  size = 16,
  filledColor = "#FBBF24",
  emptyColor = "#D1D5DB",
}: StarRatingProps) {
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <FontAwesome key={`full-${i}`} name="star" size={size} color={filledColor} />
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <FontAwesome name="star-half-o" size={size} color={filledColor} />
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <FontAwesome key={`empty-${i}`} name="star-o" size={size} color={emptyColor} />
      ))}
    </View>
  );
}
