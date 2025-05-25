import { getOverallRankings } from "./queries/overall-ranking.query";
import { RankingList } from "./ranking-list";

interface OverallRankingProps {
  type: "novel" | "rc";
  userId: string;
}

export async function OverallRanking({ type, userId }: OverallRankingProps) {
  const rankings = await getOverallRankings(type);

  return <RankingList rankings={rankings} currentUserId={userId} />;
}
