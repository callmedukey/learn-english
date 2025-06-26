import { MonthlyRankingList } from "./monthly-ranking-list";
import { getMonthlyGradeRankings } from "./queries/monthly-grade-ranking.query";

interface MonthlyGradeRankingProps {
  type: "novel" | "rc";
  userId: string;
  userGrade?: string;
}

export async function MonthlyGradeRanking({
  type,
  userId,
  userGrade,
}: MonthlyGradeRankingProps) {
  const rankings = await getMonthlyGradeRankings(type, userId, userGrade);

  return <MonthlyRankingList rankings={rankings} currentUserId={userId} />;
}