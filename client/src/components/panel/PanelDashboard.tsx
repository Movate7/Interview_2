import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { Candidate, Panel } from "@shared/schema";
import { QrCode, CheckCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeedbackForm from "./FeedbackForm";
import QRScanner from "./QRScanner";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PanelDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Get the panel for the current user
  const { data: panels = [] } = useQuery({
    queryKey: ["/api/panels"],
    queryFn: async () => {
      const response = await fetch("/api/panels");
      if (!response.ok) {
        throw new Error("Failed to fetch panels");
      }
      return response.json();
    }
  });

  // Find panel for current user (in a real app, this would be based on user assignments)
  const userPanel = panels.find((panel: Panel) => 
    panel.panelMembers.includes(user?.name || "")
  );

  // Get candidates in the queue
  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: async () => {
      const response = await fetch("/api/candidates");
      if (!response.ok) {
        throw new Error("Failed to fetch candidates");
      }
      return response.json();
    }
  });

  // Get current candidate if panel has one assigned
  useEffect(() => {
    if (userPanel?.currentCandidate) {
      const candidate = candidates.find((c: Candidate) => c.id === userPanel.currentCandidate);
      if (candidate) {
        setCurrentCandidate(candidate);
      }
    } else {
      setCurrentCandidate(null);
    }
  }, [userPanel, candidates]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    // Use secure WebSocket if page is loaded over HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocket = new WebSocket(`${protocol}//${window.location.host}/ws/app`);
    
    websocket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "CANDIDATE_UPDATED" || data.type === "CANDIDATE_CREATED") {
        // Refresh candidates query
        queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      }
      if (data.type === "PANEL_UPDATED") {
        // Refresh panels query
        queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      }
    };
    
    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);

  // Find candidates in queue for this panel's current round
  const queueCandidates = candidates
    .filter((c: Candidate) => 
      (c.status === "in_queue" || c.status === "registered") && 
      (!c.assignedPanel || c.assignedPanel === userPanel?.id)
    )
    .sort((a: Candidate, b: Candidate) => {
      // Sort by timestamp (FIFO)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

  // Handle toggling panel status
  const togglePanelStatus = async () => {
    if (!userPanel) return;
    
    try {
      const response = await fetch(`/api/panels/${userPanel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !userPanel.isActive
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update panel status");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      
      toast({
        title: "Panel Status Updated",
        description: `Panel is now ${!userPanel.isActive ? "active" : "on break"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update panel status",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-neutral-800">Panel Dashboard</h2>
        {userPanel ? (
          <p className="text-neutral-600">
            {userPanel.name} - Room {userPanel.roomNo} - 
            <span className={userPanel.isActive ? "text-green-600 font-medium" : "text-neutral-500 font-medium"}>
              {" "}{userPanel.isActive ? "Active" : "On Break"}
            </span>
          </p>
        ) : (
          <p className="text-neutral-600">
            You are not assigned to any panel yet.
          </p>
        )}
      </div>

      {/* Current Candidate */}
      {currentCandidate ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">Current Candidate</h3>
                <div className="flex items-center mb-4">
                  <span className="font-mono bg-blue-100 text-primary px-2 py-1 rounded text-sm mr-2">
                    {currentCandidate.serialNo}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs capitalize">
                    {currentCandidate.currentRound.replace('_', ' ')} Round
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-xl font-medium">{currentCandidate.name}</h4>
                  <p className="text-neutral-600">{currentCandidate.email}</p>
                  <p className="text-neutral-700 mt-1">{currentCandidate.position}</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col items-center">
                <div className="bg-white p-2 rounded-lg shadow mb-2">
                  {currentCandidate.qrCodeUrl ? (
                    <img 
                      src={currentCandidate.qrCodeUrl} 
                      alt="QR Code" 
                      className="h-32 w-32" 
                    />
                  ) : (
                    <div className="h-32 w-32 flex items-center justify-center bg-neutral-100">
                      <p className="text-xs text-neutral-500">No QR code</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Feedback Form */}
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <FeedbackForm 
                candidate={currentCandidate} 
                panelId={userPanel?.id || 0} 
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-10 text-center">
            <p className="text-neutral-600 mb-4">No candidate currently assigned to you.</p>
            {queueCandidates.length > 0 && (
              <Button 
                onClick={async () => {
                  try {
                    // Get the next candidate in queue
                    const nextCandidate = queueCandidates[0];
                    
                    if (userPanel) {
                      // Assign candidate to this panel
                      const assignResponse = await fetch(`/api/panels/${userPanel.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          currentCandidate: nextCandidate.id,
                        }),
                      });
                      
                      if (!assignResponse.ok) {
                        throw new Error("Failed to assign candidate");
                      }
                      
                      // Update candidate status
                      const candidateUpdateResponse = await fetch(`/api/candidates/${nextCandidate.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          status: "in_process",
                          assignedPanel: userPanel.id,
                        }),
                      });
                      
                      if (!candidateUpdateResponse.ok) {
                        throw new Error("Failed to update candidate status");
                      }
                      
                      // Refresh data
                      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
                      
                      toast({
                        title: "Candidate Assigned",
                        description: `${nextCandidate.name} has been assigned to your panel.`,
                        variant: "default",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to get next candidate",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Get Next Candidate
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Preview */}
      <Card className="mb-6">
        <CardHeader className="pb-0 border-b border-neutral-200">
          <CardTitle>Queue Preview</CardTitle>
        </CardHeader>
        <div className="p-4 overflow-x-auto">
          {candidatesLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : queueCandidates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-neutral-500">No candidates in queue.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Serial No
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Round
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {queueCandidates.map((candidate: Candidate, index: number) => (
                  <tr 
                    key={candidate.id} 
                    className={index === 0 && currentCandidate === null ? "bg-blue-50" : ""}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {index === 0 && currentCandidate === null ? (
                        <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-full text-xs">
                          Next
                        </span>
                      ) : (
                        <span className="text-neutral-600">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-sm text-neutral-900">{candidate.serialNo}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{candidate.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{candidate.position}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {candidate.currentRound.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-neutral-200 px-4 py-3 flex justify-between items-center text-sm">
          <div className="text-neutral-600">
            {queueCandidates.length} candidates in queue for this panel
          </div>
          <Button variant="link" className="text-primary hover:text-primary-dark">
            View All
          </Button>
        </div>
      </Card>

      {/* Scan QR and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="font-medium text-lg mb-3">Scan Candidate QR</h3>
          <p className="text-neutral-600 text-sm mb-4">Scan a candidate's QR code to quickly load their profile.</p>
          <Button 
            className="w-full flex items-center justify-center"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Open Scanner
          </Button>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium text-lg mb-3">Panel Controls</h3>
          <p className="text-neutral-600 text-sm mb-4">Manage your panel's availability status.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={userPanel?.isActive ? "default" : "outline"}
              className={userPanel?.isActive ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={togglePanelStatus}
              disabled={!userPanel}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Available
            </Button>
            <Button 
              variant={!userPanel?.isActive ? "default" : "outline"}
              className={!userPanel?.isActive ? "bg-orange-600 text-white hover:bg-orange-700" : ""}
              onClick={togglePanelStatus}
              disabled={!userPanel}
            >
              <PauseCircle className="mr-1 h-4 w-4" />
              Take Break
            </Button>
          </div>
        </Card>
      </div>

      {/* QR Scanner Dialog */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} onScan={async (serialNo) => {
          try {
            // Fetch candidate by serial number
            const response = await fetch(`/api/candidates/serial/${serialNo}`);
            if (!response.ok) {
              throw new Error("Candidate not found");
            }
            
            const candidate = await response.json();
            
            // Assign candidate to this panel
            if (userPanel) {
              const assignResponse = await fetch(`/api/panels/${userPanel.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  currentCandidate: candidate.id,
                }),
              });
              
              if (!assignResponse.ok) {
                throw new Error("Failed to assign candidate");
              }
              
              // Update candidate status
              const candidateUpdateResponse = await fetch(`/api/candidates/${candidate.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "in_process",
                  assignedPanel: userPanel.id,
                }),
              });
              
              if (!candidateUpdateResponse.ok) {
                throw new Error("Failed to update candidate status");
              }
              
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
              queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
              
              toast({
                title: "Candidate Assigned",
                description: `${candidate.name} has been assigned to your panel.`,
                variant: "default",
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to process QR code",
              variant: "destructive",
            });
          }
          
          setShowScanner(false);
        }} />
      )}
    </div>
  );
}
