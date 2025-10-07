"use client";

import { Filter } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ScoreFilterValues {
  totalScoreMin?: number;
  totalScoreMax?: number;
  lexileScoreMin?: number;
  lexileScoreMax?: number;
  rcScoreMin?: number;
  rcScoreMax?: number;
}

interface ScoreFiltersProps {
  filters: ScoreFilterValues;
  onFiltersChange: (filters: ScoreFilterValues) => void;
}

export default function ScoreFilters({
  filters,
  onFiltersChange,
}: ScoreFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ScoreFilterValues>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      totalScoreMin: undefined,
      totalScoreMax: undefined,
      lexileScoreMin: undefined,
      lexileScoreMax: undefined,
      rcScoreMin: undefined,
      rcScoreMax: undefined,
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={hasActiveFilters ? "default" : "outline"} size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Score Filters
          {hasActiveFilters && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              Active
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 font-semibold">Filter by Score Range</h4>
            <p className="text-sm text-muted-foreground">
              Set minimum and maximum values to filter users by their scores.
            </p>
          </div>

          <div className="space-y-4">
            {/* Total Score Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Score</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="totalScoreMin" className="text-xs text-muted-foreground">
                    Min
                  </Label>
                  <Input
                    id="totalScoreMin"
                    type="number"
                    placeholder="0"
                    value={localFilters.totalScoreMin ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        totalScoreMin: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="totalScoreMax" className="text-xs text-muted-foreground">
                    Max
                  </Label>
                  <Input
                    id="totalScoreMax"
                    type="number"
                    placeholder="∞"
                    value={localFilters.totalScoreMax ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        totalScoreMax: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Lexile Score Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lexile Score</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="lexileScoreMin" className="text-xs text-muted-foreground">
                    Min
                  </Label>
                  <Input
                    id="lexileScoreMin"
                    type="number"
                    placeholder="0"
                    value={localFilters.lexileScoreMin ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        lexileScoreMin: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lexileScoreMax" className="text-xs text-muted-foreground">
                    Max
                  </Label>
                  <Input
                    id="lexileScoreMax"
                    type="number"
                    placeholder="∞"
                    value={localFilters.lexileScoreMax ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        lexileScoreMax: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* RC Score Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">RC Score</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="rcScoreMin" className="text-xs text-muted-foreground">
                    Min
                  </Label>
                  <Input
                    id="rcScoreMin"
                    type="number"
                    placeholder="0"
                    value={localFilters.rcScoreMin ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        rcScoreMin: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="rcScoreMax" className="text-xs text-muted-foreground">
                    Max
                  </Label>
                  <Input
                    id="rcScoreMax"
                    type="number"
                    placeholder="∞"
                    value={localFilters.rcScoreMax ?? ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        rcScoreMax: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} size="sm" className="flex-1">
              Apply Filters
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
