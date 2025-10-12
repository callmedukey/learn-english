"use client";

import Image from "next/image";

import { ScrollArea } from "@/components/ui/scroll-area";

import { UserStatsPopover } from "./user-stats-popover";

interface RankingItem {
  id: string;
  rank: number;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  campusId?: string | null;
}

interface RankingListProps {
  rankings: RankingItem[];
  currentUserId?: string;
}

export function RankingList({ rankings, currentUserId }: RankingListProps) {
  return (
    <div className="flex flex-col p-2">
      {/* Header */}
      <div className="flex items-center gap-4 px-2 pb-2 text-xs font-semibold text-gray-600">
        <div className="w-6"></div> {/* Rank column */}
        <div className="flex min-w-0 flex-1">NICKNAME</div>
        <div className="w-12 text-center">GRADE</div>
        <div className="w-12 text-right">POINT</div>
      </div>

      {/* Rankings with scrollable container */}
      <ScrollArea className="h-[25rem] w-full">
        {rankings.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No rankings available
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((item) => (
              <UserStatsPopover key={item.id} userId={item.id}>
                <div
                  className={`flex items-center gap-4 rounded-lg p-2 transition-colors ${
                    item.id === currentUserId
                      ? "border border-amber-300 bg-amber-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex w-6 items-center justify-center">
                    <span className="font-bold text-gray-600">{item.rank}</span>
                  </div>

                  {/* User Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Country Flag */}
                    {item.countryIcon ? (
                      <div className="relative h-4 w-6 flex-shrink-0">
                        <Image
                          src={item.countryIcon}
                          alt="Country flag"
                          fill
                          className="rounded-sm object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-4 w-6 flex-shrink-0 rounded-sm bg-gray-200" />
                    )}

                    {/* Nickname with Medal */}
                    <div className="flex min-w-0 items-center gap-1">
                      <span className={`truncate font-medium ${item.campusId ? 'text-primary italic' : 'text-gray-900'}`}>
                        {item.nickname}
                      </span>
                      {item.rank === 1 && (
                        <span className="flex-shrink-0 text-base">🥇</span>
                      )}
                      {item.rank === 2 && (
                        <span className="flex-shrink-0 text-base">🥈</span>
                      )}
                      {item.rank === 3 && (
                        <span className="flex-shrink-0 text-base">🥉</span>
                      )}
                    </div>
                  </div>

                  {/* Grade */}
                  <div className="w-12 text-center font-semibold whitespace-nowrap text-gray-700">
                    {item.grade}
                  </div>

                  {/* Score */}
                  <div className="w-12 text-right font-bold text-amber-700">
                    {item.score.toLocaleString()}
                  </div>
                </div>
              </UserStatsPopover>
            ))}

            {/* Fill empty slots only up to 5 if less than 5 rankings */}
            {rankings.length < 5 &&
              Array.from({ length: 5 - rankings.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-4 p-2 opacity-30"
                >
                  <div className="w-6 text-center font-bold text-gray-400">
                    {rankings.length + i + 1}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-4 w-6 rounded-sm bg-gray-100" />
                    <div className="text-gray-400">-</div>
                  </div>
                  <div className="w-12 text-center text-gray-400">-</div>
                  <div className="w-12 text-right text-gray-400">-</div>
                </div>
              ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
