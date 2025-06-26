import { MonthlyRankingList } from "./monthly-ranking-list";
import { getMonthlyOverallRankings } from "./queries/monthly-user-ranking.query";

interface MonthlyOverallRankingProps {
  type: "novel" | "rc";
  userId: string;
}

export async function MonthlyOverallRanking({
  type,
  userId,
}: MonthlyOverallRankingProps) {
  const rankings = await getMonthlyOverallRankings(type);

  return <MonthlyRankingList rankings={rankings} currentUserId={userId} />;
}