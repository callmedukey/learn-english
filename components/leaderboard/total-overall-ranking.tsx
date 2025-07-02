import { getTotalOverallRankings } from "./queries/overall-ranking.query";
import { RankingList } from "./ranking-list";

interface TotalOverallRankingProps {
  userId: string;
}

export async function TotalOverallRanking({ userId }: TotalOverallRankingProps) {
  const rankings = await getTotalOverallRankings();

  return <RankingList rankings={rankings} currentUserId={userId} />;
}