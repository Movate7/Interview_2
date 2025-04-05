import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CandidateFeedback } from "@shared/schema";

// Rating mappings (maps 1-5 scale to excellent/good/average/poor)
type RatingKey = 'excellent' | 'good' | 'average' | 'poor';

// Rating aggregation interface
interface RatingCounts {
  excellent: number;
  good: number;
  average: number;
  poor: number;
  [key: string]: number;
}

// Convert numeric rating to rating key
function numericToRatingKey(rating: number): RatingKey {
  switch(rating) {
    case 5: return 'excellent';
    case 4: return 'good';
    case 3: return 'average';
    case 2: 
    case 1:
    default: return 'poor';
  }
}

// Rating colors
const COLORS = {
  excellent: "#4ade80",  // Green
  good: "#60a5fa",       // Blue
  average: "#fbbf24",    // Yellow
  poor: "#ef4444"        // Red
};

export default function CandidateFeedbackAnalytics() {
  const [selectedFeedback, setSelectedFeedback] = useState<CandidateFeedback | null>(null);

  // Fetch all candidate feedback
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["/api/candidate-feedback"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/candidate-feedback");
      return response.json();
    }
  });

  // Aggregate ratings into counts
  const aggregateRatings = (feedbacks: CandidateFeedback[]) => {
    const overallExperience: RatingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };
    const processRating: RatingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };
    const interviewerRating: RatingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };
    const environmentRating: RatingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };
    const waitTimeRating: RatingCounts = { excellent: 0, good: 0, average: 0, poor: 0 };

    feedbacks.forEach(feedback => {
      // Map the numeric ratings (1-5) to our rating categories
      const overallKey = numericToRatingKey(feedback.overallExperience);
      const interviewerKey = numericToRatingKey(feedback.interviewerProfessionalism);
      // Use interview difficulty for process rating
      const processKey = numericToRatingKey(feedback.interviewDifficulty);
      // Use interview fairness for environment rating
      const environmentKey = numericToRatingKey(feedback.interviewFairness);
      // Default wait time to the overall experience since it's not in the schema
      const waitTimeKey = overallKey;
      
      overallExperience[overallKey] += 1;
      processRating[processKey] += 1;
      interviewerRating[interviewerKey] += 1;
      environmentRating[environmentKey] += 1;
      waitTimeRating[waitTimeKey] += 1;
    });

    return {
      overallExperience,
      processRating,
      interviewerRating,
      environmentRating,
      waitTimeRating
    };
  };

  // Convert rating counts to chart data
  const convertToChartData = (ratingCounts: RatingCounts) => {
    return Object.entries(ratingCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  // Calculate average score (excellent=4, good=3, average=2, poor=1)
  const calculateAverageScore = (ratingCounts: RatingCounts) => {
    const weights: Record<string, number> = { excellent: 4, good: 3, average: 2, poor: 1 };
    const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
    
    if (totalRatings === 0) return 0;
    
    const weightedSum = Object.entries(ratingCounts).reduce(
      (sum, [rating, count]) => sum + (weights[rating] || 0) * count, 
      0
    );
    
    return weightedSum / totalRatings;
  };

  // Prepare chart data
  const ratings = aggregateRatings(feedbacks as CandidateFeedback[]);
  
  const overallChartData = convertToChartData(ratings.overallExperience);
  const processChartData = convertToChartData(ratings.processRating);
  const interviewerChartData = convertToChartData(ratings.interviewerRating);
  const environmentChartData = convertToChartData(ratings.environmentRating);
  const waitTimeChartData = convertToChartData(ratings.waitTimeRating);
  
  // All ratings for bar chart
  const barChartData = [
    { 
      name: 'Overall', 
      Excellent: ratings.overallExperience.excellent,
      Good: ratings.overallExperience.good,
      Average: ratings.overallExperience.average,
      Poor: ratings.overallExperience.poor
    },
    { 
      name: 'Process', 
      Excellent: ratings.processRating.excellent,
      Good: ratings.processRating.good,
      Average: ratings.processRating.average,
      Poor: ratings.processRating.poor
    },
    { 
      name: 'Interviewers', 
      Excellent: ratings.interviewerRating.excellent,
      Good: ratings.interviewerRating.good,
      Average: ratings.interviewerRating.average,
      Poor: ratings.interviewerRating.poor
    },
    { 
      name: 'Environment', 
      Excellent: ratings.environmentRating.excellent,
      Good: ratings.environmentRating.good,
      Average: ratings.environmentRating.average,
      Poor: ratings.environmentRating.poor
    },
    { 
      name: 'Wait Time', 
      Excellent: ratings.waitTimeRating.excellent,
      Good: ratings.waitTimeRating.good,
      Average: ratings.waitTimeRating.average,
      Poor: ratings.waitTimeRating.poor
    }
  ];

  // Calculate average scores
  const averageScores = {
    overall: calculateAverageScore(ratings.overallExperience).toFixed(2),
    process: calculateAverageScore(ratings.processRating).toFixed(2),
    interviewer: calculateAverageScore(ratings.interviewerRating).toFixed(2),
    environment: calculateAverageScore(ratings.environmentRating).toFixed(2),
    waitTime: calculateAverageScore(ratings.waitTimeRating).toFixed(2)
  };

  // Sort feedbacks by submission date (newest first)
  const sortedFeedbacks = [...feedbacks] as CandidateFeedback[];
  sortedFeedbacks.sort((a, b) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString();
  };

  // Get color for rating
  const getRatingColor = (rating: string | RatingKey) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScores.overall}</div>
            <p className="text-xs text-muted-foreground">out of 4.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Process Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScores.process}</div>
            <p className="text-xs text-muted-foreground">out of 4.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interviewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScores.interviewer}</div>
            <p className="text-xs text-muted-foreground">out of 4.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScores.environment}</div>
            <p className="text-xs text-muted-foreground">out of 4.00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScores.waitTime}</div>
            <p className="text-xs text-muted-foreground">out of 4.00</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="barChart">
            <TabsList className="mb-4">
              <TabsTrigger value="barChart">Bar Chart</TabsTrigger>
              <TabsTrigger value="overallExp">Overall Experience</TabsTrigger>
              <TabsTrigger value="processRating">Process</TabsTrigger>
              <TabsTrigger value="interviewers">Interviewers</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="waitTime">Wait Time</TabsTrigger>
            </TabsList>

            <TabsContent value="barChart">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Excellent" stackId="a" fill={COLORS.excellent} />
                    <Bar dataKey="Good" stackId="a" fill={COLORS.good} />
                    <Bar dataKey="Average" stackId="a" fill={COLORS.average} />
                    <Bar dataKey="Poor" stackId="a" fill={COLORS.poor} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="overallExp">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="processRating">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {processChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="interviewers">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={interviewerChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {interviewerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="environment">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={environmentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {environmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="waitTime">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={waitTimeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {waitTimeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-7 bg-muted p-4 gap-4 font-medium text-sm">
              <div className="col-span-1">Date</div>
              <div className="col-span-1">Overall</div>
              <div className="col-span-1">Process</div>
              <div className="col-span-1">Interviewers</div>
              <div className="col-span-1">Environment</div>
              <div className="col-span-1">Wait Time</div>
              <div className="col-span-1">Anonymous</div>
            </div>
            <div className="divide-y">
              {sortedFeedbacks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No feedback submissions yet
                </div>
              ) : (
                sortedFeedbacks.map((feedback) => (
                  <div 
                    key={feedback.id} 
                    className="grid grid-cols-7 p-4 gap-4 text-sm items-center cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <div className="col-span-1 font-mono">
                      {formatDate(feedback.submittedAt)}
                    </div>
                    <div className="col-span-1">
                      <Badge className={getRatingColor(numericToRatingKey(feedback.overallExperience))}>
                        {feedback.overallExperience}/5
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge className={getRatingColor(numericToRatingKey(feedback.interviewDifficulty))}>
                        {feedback.interviewDifficulty}/5
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge className={getRatingColor(numericToRatingKey(feedback.interviewerProfessionalism))}>
                        {feedback.interviewerProfessionalism}/5
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge className={getRatingColor(numericToRatingKey(feedback.interviewFairness))}>
                        {feedback.interviewFairness}/5
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Badge className={getRatingColor(numericToRatingKey(feedback.overallExperience))}>
                        {feedback.overallExperience}/5
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      {feedback.anonymous ? (
                        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          No
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected feedback details */}
      {selectedFeedback && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Feedback Details</CardTitle>
            <button 
              onClick={() => setSelectedFeedback(null)}
              className="rounded-full p-1 hover:bg-muted"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Submitted At</h3>
                <p>{formatDate(selectedFeedback.submittedAt)}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Anonymous</h3>
                <p>{selectedFeedback.anonymous ? "Yes" : "No"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Ratings</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Badge className={getRatingColor(numericToRatingKey(selectedFeedback.overallExperience))}>
                  Overall: {selectedFeedback.overallExperience}/5
                </Badge>
                <Badge className={getRatingColor(numericToRatingKey(selectedFeedback.interviewDifficulty))}>
                  Process: {selectedFeedback.interviewDifficulty}/5
                </Badge>
                <Badge className={getRatingColor(numericToRatingKey(selectedFeedback.interviewerProfessionalism))}>
                  Interviewers: {selectedFeedback.interviewerProfessionalism}/5
                </Badge>
                <Badge className={getRatingColor(numericToRatingKey(selectedFeedback.interviewFairness))}>
                  Environment: {selectedFeedback.interviewFairness}/5
                </Badge>
                <Badge className={getRatingColor(numericToRatingKey(selectedFeedback.overallExperience))}>
                  Wait Time: {selectedFeedback.overallExperience}/5
                </Badge>
              </div>
            </div>

            {selectedFeedback.reasonsRating && (
              <div>
                <h3 className="font-medium mb-1">Reasons for Rating</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.reasonsRating}</p>
              </div>
            )}

            {selectedFeedback.improvementSuggestions && (
              <div>
                <h3 className="font-medium mb-1">Improvement Suggestions</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.improvementSuggestions}</p>
              </div>
            )}

            {selectedFeedback.comparisonToOthers && (
              <div>
                <h3 className="font-medium mb-1">Comparison to Other Interviews</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.comparisonToOthers}</p>
              </div>
            )}

            {selectedFeedback.additionalComments && (
              <div>
                <h3 className="font-medium mb-1">Additional Comments</h3>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.additionalComments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}