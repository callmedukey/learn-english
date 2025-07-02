import { getTotalGradeRankings } from "./queries/grade-ranking.query";
import { RankingList } from "./ranking-list";

interface TotalGradeRankingProps {
  userId: string;
  userGrade?: string;
}

export async function TotalGradeRanking({ userId, userGrade }: TotalGradeRankingProps) {
  const rankings = await getTotalGradeRankings(userId, userGrade);

  return <RankingList rankings={rankings} currentUserId={userId} />;
}