import { MonthlyRankingList } from "@/components/leaderboard/monthly-ranking-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getDummyMonthlyRankingsWithMedals, 
  DUMMY_AR_LEVELS, 
  DUMMY_RC_LEVELS,
  getDummyMedalImages,
  getDummyUserMedalsWithImages
} from "@/lib/dummy-data/medal-images-dummy-data";
import Image from "next/image";
import { Medal } from "lucide-react";

export default function MedalLeaderboardDemo() {
  // Get dummy data for different levels
  const ar20Rankings = getDummyMonthlyRankingsWithMedals("novel", "2.0");
  const ar30Rankings = getDummyMonthlyRankingsWithMedals("novel", "3.0");
  const rcB1Rankings = getDummyMonthlyRankingsWithMedals("rc", "B1");
  const rcC1Rankings = getDummyMonthlyRankingsWithMedals("rc", "C1");
  
  // Get medal images for specific levels
  const ar20Medals = getDummyMedalImages("AR", "ar-4"); // AR 2.0
  const rcB1Medals = getDummyMedalImages("RC", "rc-3"); // RC B1
  
  // Get user medals
  const userMedals = getDummyUserMedalsWithImages("user-1");

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Medal Images Leaderboard Demo</h1>
      
      {/* Show medal images for levels */}
      <Card>
        <CardHeader>
          <CardTitle>Medal Images Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AR 2.0 Medals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">AR 2.0 Medal Images</h3>
            <div className="flex gap-4">
              {ar20Medals && Object.entries(ar20Medals).map(([type, url]) => (
                <div key={type} className="text-center">
                  <div className="relative w-16 h-16 mb-2">
                    <Image
                      src={url}
                      alt={`${type} medal`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.src = `https://via.placeholder.com/64/FFD700/000000?text=${type}`;
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium">{type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RC B1 Medals */}
          <div>
            <h3 className="text-lg font-semibold mb-3">RC B1 Medal Images</h3>
            <div className="flex gap-4">
              {rcB1Medals && Object.entries(rcB1Medals).map(([type, url]) => (
                <div key={type} className="text-center">
                  <div className="relative w-16 h-16 mb-2">
                    <Image
                      src={url}
                      alt={`${type} medal`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.src = `https://via.placeholder.com/64/C0C0C0/000000?text=${type}`;
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Leaderboards with Medal Images */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Novel AR 2.0 */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg">
            <CardTitle className="text-lg">Monthly Novel AR 2.0 Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MonthlyRankingList 
              rankings={ar20Rankings}
              currentUserId="user-1"
            />
          </CardContent>
        </Card>

        {/* Novel AR 3.0 */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg">
            <CardTitle className="text-lg">Monthly Novel AR 3.0 Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MonthlyRankingList 
              rankings={ar30Rankings}
              currentUserId="user-2"
            />
          </CardContent>
        </Card>

        {/* RC B1 */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg">
            <CardTitle className="text-lg">Monthly RC B1 Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MonthlyRankingList 
              rankings={rcB1Rankings}
              currentUserId="user-3"
            />
          </CardContent>
        </Card>

        {/* RC C1 */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg">
            <CardTitle className="text-lg">Monthly RC C1 Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MonthlyRankingList 
              rankings={rcC1Rankings}
              currentUserId="user-4"
            />
          </CardContent>
        </Card>
      </div>

      {/* User Medals Display */}
      <Card>
        <CardHeader>
          <CardTitle>User Medal Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userMedals.map((medal) => (
              <div 
                key={medal.id} 
                className="border rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
              >
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <Image
                    src={medal.imageUrl}
                    alt={`${medal.medalType} medal`}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      // Fallback icon if image doesn't exist
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center">
                          <svg class="w-8 h-8 ${
                            medal.medalType === 'GOLD' ? 'text-yellow-500' : 
                            medal.medalType === 'SILVER' ? 'text-gray-400' : 
                            'text-orange-600'
                          }" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                        </div>`;
                      }
                    }}
                  />
                </div>
                <p className="font-semibold text-sm">{medal.levelName}</p>
                <p className={`text-xs ${
                  medal.medalType === 'GOLD' ? 'text-yellow-600' : 
                  medal.medalType === 'SILVER' ? 'text-gray-600' : 
                  'text-orange-600'
                }`}>
                  {medal.medalType}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {medal.month}/{medal.year}
                </p>
                <p className="text-xs font-medium mt-1">{medal.score} pts</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">Medal Images Setup</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>The medal images are expected to be in the following format:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>/uploads/medals/ar-{"{level}"}-{"{medal-type}"}.png</code> for Novel levels</li>
              <li><code>/uploads/medals/rc-{"{level}"}-{"{medal-type}"}.png</code> for RC levels</li>
            </ul>
            <p className="mt-3">Example paths:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>/uploads/medals/ar-2.0-gold.png</code></li>
              <li><code>/uploads/medals/ar-2.0-silver.png</code></li>
              <li><code>/uploads/medals/ar-2.0-bronze.png</code></li>
              <li><code>/uploads/medals/rc-b1-gold.png</code></li>
            </ul>
            <p className="mt-3">
              If images are not found, the demo will show placeholder images. 
              Upload your actual medal images to the <code>/public/uploads/medals/</code> directory.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}