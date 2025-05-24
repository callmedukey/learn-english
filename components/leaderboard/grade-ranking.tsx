import { getGradeRankings } from "./queries/grade-ranking.query";
import { RankingList } from "./ranking-list";

interface GradeRankingProps {
  type: "novel" | "rc";
  userId: string;
  userGrade?: string;
}

export async function GradeRanking({
  type,
  userId,
  userGrade,
}: GradeRankingProps) {
  const rankings = await getGradeRankings(type, userId, userGrade);

  return <RankingList rankings={rankings} currentUserId={userId} />;
}
