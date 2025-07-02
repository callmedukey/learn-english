import { MonthlyRankingList } from "./monthly-ranking-list";
import { getTotalMonthlyGradeRankings } from "./queries/monthly-grade-ranking.query";

interface MonthlyTotalGradeRankingProps {
  userId: string;
  userGrade?: string;
}

export async function MonthlyTotalGradeRanking({
  userId,
  userGrade,
}: MonthlyTotalGradeRankingProps) {
  const rankings = await getTotalMonthlyGradeRankings(userId, userGrade);

  return <MonthlyRankingList rankings={rankings} currentUserId={userId} />;
}