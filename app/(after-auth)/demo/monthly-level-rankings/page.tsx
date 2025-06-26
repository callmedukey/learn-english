import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyRankingList } from "@/components/leaderboard/monthly-ranking-list";
import { getMonthlyLevelRankings } from "@/components/leaderboard/queries/monthly-level-ranking.query";
import { prisma } from "@/prisma/prisma-client";

export default async function MonthlyLevelRankingsDemo() {
  // Get AR levels that have medal images
  const arLevelsWithMedals = await prisma.aR.findMany({
    where: {
      id: {
        in: [
          "9abfb344-6089-4812-b014-03637480b9dd", // AR Level 2
          "00623185-c4de-4db4-9737-28038cd6c7b5", // AR Level 3
          "2775192c-ad6f-4982-893b-3af84abeb7f3", // AR Level 4
        ],
      },
    },
    orderBy: { stars: "asc" },
  });

  // Get rankings for each level
  const levelRankings = await Promise.all(
    arLevelsWithMedals.map(async (level) => {
      const rankings = await getMonthlyLevelRankings("AR", level.id);
      return {
        level,
        rankings,
      };
    })
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Monthly Level Rankings with Medal Images</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {levelRankings.map(({ level, rankings }) => (
          <Card key={level.id} className="h-fit">
            <CardHeader className="bg-primary text-white rounded-t-lg">
              <CardTitle className="text-lg">
                {level.level} Monthly Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MonthlyRankingList 
                rankings={rankings}
                currentUserId="cmb2bqozs0004p3a3ex0yoop8" // dukekim for demo
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Medal Images Display */}
      <Card>
        <CardHeader>
          <CardTitle>Medal Images in Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {levelRankings.map(({ level, rankings }) => (
              <div key={level.id}>
                <h3 className="text-lg font-semibold mb-2">{level.level}</h3>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  {rankings.slice(0, 3).map((ranking) => (
                    ranking.medalImageUrl && (
                      <div key={ranking.rank} className="text-center">
                        <img
                          src={ranking.medalImageUrl}
                          alt={`${ranking.rank === 1 ? 'Gold' : ranking.rank === 2 ? 'Silver' : 'Bronze'} medal`}
                          className="w-16 h-16 mx-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/64/${
                              ranking.rank === 1 ? 'FFD700' : 
                              ranking.rank === 2 ? 'C0C0C0' : 
                              'CD7F32'
                            }/000000?text=${
                              ranking.rank === 1 ? 'GOLD' : 
                              ranking.rank === 2 ? 'SILVER' : 
                              'BRONZE'
                            }`;
                          }}
                        />
                        <p className="text-sm font-medium mt-1">
                          {ranking.rank === 1 ? 'Gold' : ranking.rank === 2 ? 'Silver' : 'Bronze'}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">How Medal Images Work</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>Medal images are stored in the database and linked to specific AR/RC levels.</p>
            <p>The images are displayed for the top 3 users in each level's monthly ranking.</p>
            <p>Image paths in the database: <code>/api/uploads/medals/...</code></p>
            <p className="mt-3">To view the actual images, make sure your uploads directory is properly configured and accessible.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}