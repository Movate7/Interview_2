import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Candidate } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import QueueStatus from "@/components/candidate/QueueStatus";
import { fetchCandidateByEmail, fetchCandidates } from "@/lib/googleSheets";
import { queryClient } from "@/lib/queryClient";

export default function EmailQueuePage() {
  const { email } = useParams();
  const [queuePosition, setQueuePosition] = useState(0);
  const [candidatesAhead, setCandidatesAhead] = useState<Candidate[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Decode the email parameter (it may be URL encoded)
  const decodedEmail = email ? decodeURIComponent(email) : "";

  // Fetch candidate data
  const { data: candidate, isLoading, error } = useQuery({
    queryKey: [`/api/candidates/email/${decodedEmail}`],
    queryFn: () => fetchCandidateByEmail(decodedEmail),
    enabled: !!decodedEmail
  });

  // Fetch all candidates for queue position calculation
  const { data: allCandidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: fetchCandidates,
    enabled: !!candidate
  });

  // Calculate queue position and candidates ahead
  useEffect(() => {
    if (candidate && allCandidates.length > 0) {
      // Filter candidates in the same round and status
      const sameRoundCandidates = allCandidates.filter(c => 
        c.currentRound === candidate.currentRound && 
        ["registered", "in_queue"].includes(c.status)
      );
      
      // Sort by timestamp (registration time)
      const sortedCandidates = [...sameRoundCandidates].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Find position of current candidate
      const position = sortedCandidates.findIndex(c => c.email === candidate.email);
      setQueuePosition(position !== -1 ? position + 1 : 0);
      
      // Get candidates ahead in queue
      const ahead = sortedCandidates.filter((_, index) => index < position);
      setCandidatesAhead(ahead);
    }
  }, [candidate, allCandidates]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (candidate) {
      // Use secure WebSocket if page is loaded over HTTPS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const websocket = new WebSocket(`${protocol}//${window.location.host}/ws/app`);
      
      websocket.onopen = () => {
        console.log("WebSocket connected");
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            (data.type === "CANDIDATE_UPDATED" && data.data.id === candidate.id) ||
            data.type === "CANDIDATE_CREATED" ||
            data.type === "PANEL_UPDATED"
          ) {
            // Refresh data
            queryClient.invalidateQueries({ queryKey: [`/api/candidates/email/${decodedEmail}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      setWs(websocket);
      
      return () => {
        websocket.close();
      };
    }
  }, [candidate, decodedEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-3 mb-4">
                <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2 className="text-2xl font-medium mb-2">Candidate Not Found</h2>
              <p className="text-neutral-600 mb-6">
                We couldn't find a candidate with email: {decodedEmail}
              </p>
              <Link 
                to="/"
                className="text-primary hover:underline cursor-pointer">
                Return to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-3xl mx-auto p-4">
        {/* Public Header */}
        <Card className="mb-6 text-center">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center rounded-full bg-primary-light bg-opacity-20 p-3 mb-4">
              <svg 
                className="h-10 w-10 text-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-medium text-neutral-800 mb-2">Walk-In Drive Queue Status</h1>
            <p className="text-neutral-600 mb-4">Track your position in the interview queue</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex flex-col md:flex-row items-center justify-center">
              <div className="font-mono text-xl md:text-2xl font-medium text-primary mb-2 md:mb-0 md:mr-6">{candidate.serialNo}</div>
              {candidate.qrCodeUrl && (
                <div className="bg-white p-1 rounded shadow-sm">
                  <img src={candidate.qrCodeUrl} alt="QR Code" className="h-24 w-24" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="text-center">
                <p className="text-sm text-neutral-500">Your Position</p>
                <div className="text-3xl font-medium text-neutral-800 mt-1">{queuePosition}</div>
              </div>
              
              <div className="h-10 border-l border-neutral-300 hidden sm:block"></div>
              
              <div className="text-center">
                <p className="text-sm text-neutral-500">Current Round</p>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mt-1 capitalize">
                  {candidate.status === "in_process" ? "In Process" : "In Queue"} - {candidate.currentRound.replace('_', ' ')} Round
                </div>
              </div>
              
              <div className="h-10 border-l border-neutral-300 hidden sm:block"></div>
              
              <div className="text-center">
                <p className="text-sm text-neutral-500">Room Number</p>
                <div className="text-3xl font-medium text-neutral-800 mt-1">
                  {candidate.roomNo || "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Name</p>
                <p className="font-medium">{candidate.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium">{candidate.email}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Position</p>
                <p className="font-medium">{candidate.position}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Registration Time</p>
                <p className="font-medium">
                  {new Date(candidate.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <QueueStatus 
          candidate={candidate} 
          queuePosition={queuePosition}
          candidatesAhead={candidatesAhead}
        />

        {/* Contact Info */}
        <div className="text-center text-sm text-neutral-500 mb-8">
          <p>Having issues? Contact the help desk or email <a href="mailto:support@example.com" className="text-primary">support@example.com</a></p>
        </div>
      </div>
    </div>
  );
}