import { Star } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BPALevelCardProps {
  level: {
    id: string;
    name: string;
    stars: number;
    novelsAvailable?: number;
  };
}

export function BPALevelCard({ level }: BPALevelCardProps) {
  return (
    <Link href={`/bpa/${level.id}`} className="group">
      <Card className="h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold uppercase text-card-foreground">
              {level.name}
            </CardTitle>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.floor(level.stars) }).map((_, i) => (
                <Star
                  key={`full-${i}`}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
              {level.stars % 1 >= 0.5 && (
                <div className="relative h-4 w-4">
                  <Star className="absolute left-0 top-0 h-4 w-4 text-gray-300" />
                  <div
                    className="absolute left-0 top-0 overflow-hidden"
                    style={{ width: "8px" }}
                  >
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              )}
              {Array.from({
                length: 5 - Math.floor(level.stars) - (level.stars % 1 >= 0.5 ? 1 : 0),
              }).map((_, i) => (
                <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {level.novelsAvailable !== undefined && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {level.novelsAvailable} novel{level.novelsAvailable !== 1 ? "s" : ""} available
              </span>
              <span className="text-primary transition-colors group-hover:text-primary/80">
                Explore →
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
