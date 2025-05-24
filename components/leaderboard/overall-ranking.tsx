import { getOverallRankings } from "./queries/overall-ranking.query";
import { RankingList } from "./ranking-list";

interface OverallRankingProps {
  type: "novel" | "rc";
}

export async function OverallRanking({ type }: OverallRankingProps) {
  const rankings = await getOverallRankings(type);

  return <RankingList rankings={rankings} />;
}
