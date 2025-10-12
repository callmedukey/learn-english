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
    novelsAvailable?: number;
  };
}

export function BPALevelCard({ level }: BPALevelCardProps) {
  return (
    <Link href={`/bpa/${level.id}`} className="group">
      <Card className="h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold uppercase text-card-foreground">
            {level.name}
          </CardTitle>
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
