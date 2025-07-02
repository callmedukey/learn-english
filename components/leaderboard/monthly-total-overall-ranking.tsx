import { MonthlyRankingList } from "./monthly-ranking-list";
import { getTotalMonthlyOverallRankings } from "./queries/monthly-user-ranking.query";

interface MonthlyTotalOverallRankingProps {
  userId: string;
}

export async function MonthlyTotalOverallRanking({
  userId,
}: MonthlyTotalOverallRankingProps) {
  const rankings = await getTotalMonthlyOverallRankings();

  return <MonthlyRankingList rankings={rankings} currentUserId={userId} />;
}