import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import PanelManagement from "@/components/admin/PanelManagement";
import KanbanBoard from "@/components/admin/KanbanBoard";
import RoomManagement from "@/components/admin/RoomManagement";
import GoogleSheetsIntegration from "@/components/admin/GoogleSheetsIntegration";
import CandidateFeedbackAnalytics from "@/components/admin/CandidateFeedbackAnalytics";
import UserManagement from "@/components/admin/UserManagement";
import { fetchCandidates } from "@/lib/googleSheets";
import { useAuth } from "@/components/auth/AuthContext";

export default function AdminPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<"dashboard" | "panels" | "pipeline" | "rooms" | "sheets" | "feedback" | "users">("dashboard");
  
  // Fetch candidates for the pipeline view
  const { 
    data: candidates = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['/api/candidates'],
    queryFn: fetchCandidates,
    enabled: activeView === "pipeline"
  });

  // Set the active view based on the URL and update
  // This effect handles both the initial URL mapping and syncs 
  // when the user navigates with the top menu
  useEffect(() => {
    if (location === "/admin") {
      setActiveView("dashboard");
    } else if (location === "/admin/panels") {
      setActiveView("panels");
    } else if (location === "/admin/pipeline") {
      setActiveView("pipeline");
    } else if (location === "/admin/rooms") {
      setActiveView("rooms");
    } else if (location === "/admin/sheets") {
      setActiveView("sheets");
    } else if (location === "/admin/feedback") {
      setActiveView("feedback");
    } else if (location === "/admin/users") {
      setActiveView("users");
    }
  }, [location]);

  return (
    <AppLayout requiredRole="admin">
      {/* Tabs Navigation */}
      <div className="mb-4 border-b border-neutral-200">
        <nav className="flex -mb-px">
          <Link href="/admin">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "dashboard" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Dashboard
            </div>
          </Link>
          <Link href="/admin/panels">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "panels" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Manage Panels
            </div>
          </Link>
          <Link href="/admin/pipeline">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "pipeline" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Pipeline
            </div>
          </Link>
          <Link href="/admin/rooms">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "rooms" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Rooms
            </div>
          </Link>
          <Link href="/admin/sheets">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "sheets" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Google Sheets
            </div>
          </Link>
          <Link href="/admin/feedback">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "feedback" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Feedback
            </div>
          </Link>
          <Link href="/admin/users">
            <div 
              className={`py-4 px-6 text-sm font-medium border-b-2 cursor-pointer ${
                activeView === "users" 
                  ? "text-primary border-primary" 
                  : "text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 border-transparent"
              }`}
            >
              Users
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      {activeView === "dashboard" && <AdminDashboard />}
      {activeView === "panels" && <PanelManagement />}
      {activeView === "rooms" && <RoomManagement />}
      {activeView === "sheets" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Google Sheets Integration</h2>
          </div>
          <p className="text-neutral-500 mb-4">
            Connect your Google Forms and Sheets to automate candidate registration
          </p>
          <GoogleSheetsIntegration />
        </div>
      )}
      {activeView === "pipeline" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Recruitment Pipeline</h2>
            <button 
              onClick={() => refetch()}
              className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <p className="text-neutral-500 mb-4">
            Drag and drop candidates between stages to update their status
          </p>
          <KanbanBoard 
            candidates={candidates} 
            isLoading={isLoading} 
            refetch={refetch}
          />
        </div>
      )}
      {activeView === "feedback" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Candidate Feedback Analysis</h2>
          </div>
          <p className="text-neutral-500 mb-4">
            Review and analyze the feedback provided by candidates after their interviews
          </p>
          <CandidateFeedbackAnalytics />
        </div>
      )}
      {activeView === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">User Management</h2>
          </div>
          <p className="text-neutral-500 mb-4">
            Manage users and their role permissions in the system
          </p>
          <UserManagement />
        </div>
      )}
    </AppLayout>
  );
}
