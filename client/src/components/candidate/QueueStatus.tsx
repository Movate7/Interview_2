import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Candidate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";

interface QueueStatusProps {
  candidate: Candidate;
  queuePosition: number;
  candidatesAhead: Candidate[];
}

export default function QueueStatus({ candidate, queuePosition, candidatesAhead }: QueueStatusProps) {
  const [estimatedWait, setEstimatedWait] = useState<string>("Calculating...");
  
  // Calculate estimated wait time based on position
  useEffect(() => {
    // Average interview time (in minutes) per round
    const avgTimePerRound: { [key: string]: number } = {
      gd: 10,
      screening: 15,
      manager: 20
    };

    // Calculate based on candidates ahead and average time for current round
    const timePerCandidate = avgTimePerRound[candidate.currentRound] || 15;
    const waitTimeMinutes = queuePosition * timePerCandidate;
    
    if (waitTimeMinutes < 1) {
      setEstimatedWait("< 1 min");
    } else if (waitTimeMinutes < 60) {
      setEstimatedWait(`~${waitTimeMinutes} min`);
    } else {
      const hours = Math.floor(waitTimeMinutes / 60);
      const minutes = waitTimeMinutes % 60;
      setEstimatedWait(`~${hours}h ${minutes}m`);
    }
  }, [queuePosition, candidate.currentRound]);

  // Get round display name
  const getRoundDisplayName = (roundKey: string): string => {
    const roundNames: { [key: string]: string } = {
      gd: "GD Round",
      screening: "Screening Round",
      manager: "Manager Round",
      hr: "HR Round",
      technical_round_2: "Technical Round 2"
    };
    return roundNames[roundKey] || roundKey;
  };

  // Get status badge
  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case "registered":
        return <Badge variant="outline">Registered</Badge>;
      case "in_queue":
        return <Badge className="bg-yellow-100 text-yellow-800">In Queue</Badge>;
      case "in_process":
        return <Badge className="bg-green-100 text-green-800">In Process</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      {/* Queue Status Card */}
      <Card className="mb-6">
        <CardHeader className="border-b border-neutral-200 px-6 py-3">
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            {/* Progress Steps */}
            <div className="hidden sm:block w-full bg-neutral-200 rounded-full h-2 mb-8">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ 
                  width: candidate.currentRound === "gd" 
                    ? "25%" 
                    : candidate.currentRound === "screening" 
                    ? "50%" 
                    : candidate.currentRound === "manager" 
                    ? "75%" 
                    : "100%" 
                }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="flex justify-between mb-8">
              <div className="relative flex flex-col items-center">
                <div className="rounded-full h-8 w-8 bg-primary text-white flex items-center justify-center z-10">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="text-sm mt-2 text-center">Registration</div>
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 ${["gd", "screening", "manager"].includes(candidate.currentRound) ? "bg-primary-light" : "bg-neutral-300"} text-white flex items-center justify-center z-10`}>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="text-sm mt-2 text-center">GD Round</div>
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 ${["screening", "manager"].includes(candidate.currentRound) ? "bg-primary-light" : "bg-neutral-300"} text-${["screening", "manager"].includes(candidate.currentRound) ? "white" : "neutral-500"} flex items-center justify-center z-10`}>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="text-sm mt-2 text-center">Screening</div>
              </div>
              
              <div className="relative flex flex-col items-center">
                <div className={`rounded-full h-8 w-8 ${candidate.currentRound === "manager" ? "bg-primary-light" : "bg-neutral-300"} text-${candidate.currentRound === "manager" ? "white" : "neutral-500"} flex items-center justify-center z-10`}>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="text-sm mt-2 text-center">Manager Round</div>
              </div>
            </div>
          </div>

          {/* Next Up List */}
          <div className="border border-neutral-200 rounded-md">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h3 className="font-medium">Current Queue</h3>
            </div>
            <div className="divide-y divide-neutral-200">
              {candidatesAhead.length === 0 ? (
                <div className="px-4 py-3 text-center text-neutral-500">
                  You're next in line!
                </div>
              ) : (
                candidatesAhead.slice(0, 3).map((c, index) => (
                  <div key={c.id} className="px-4 py-3 flex items-center">
                    <div className={`${index === 0 ? "bg-warning" : "bg-neutral-300"} text-${index === 0 ? "white" : "neutral-600"} h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium mr-3`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-neutral-500">Serial #{c.serialNo}</p>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                ))
              )}
              
              <div className={`px-4 py-3 flex items-center ${candidate.status === "in_process" ? "bg-green-50" : "bg-blue-50"}`}>
                <div className="bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  {queuePosition}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-sm">{candidate.name}</p>
                  <p className="text-xs text-neutral-500">Serial #{candidate.serialNo}</p>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(candidate.status)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-3">Important Instructions</h2>
          <div className="space-y-2">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-primary mt-0.5 mr-2" />
              <p className="text-sm text-neutral-700">Keep this page open to see live updates of your queue position.</p>
            </div>
            <div className="flex items-start">
              <Info className="h-5 w-5 text-primary mt-0.5 mr-2" />
              <p className="text-sm text-neutral-700">Show your QR code to the panel members when called for the interview.</p>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <p className="text-sm text-neutral-700">If you miss your turn, you will be moved to the end of the queue.</p>
            </div>
            <div className="flex items-start">
              <Info className="h-5 w-5 text-primary mt-0.5 mr-2" />
              <p className="text-sm text-neutral-700">Ensure you have all required documents ready before your turn.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
