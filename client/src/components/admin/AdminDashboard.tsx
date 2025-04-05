import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, User, ListChecks, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from "../common/StatsCard";
import CandidateTable from "./CandidateTable";
import { fetchCandidates } from "@/lib/googleSheets";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("candidates");
  
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["/api/candidates"],
    queryFn: fetchCandidates
  });

  // Calculate stats
  const stats = {
    totalCandidates: candidates.length,
    activePanels: 5, // This would come from a panels API
    inQueue: candidates.filter(c => c.status === "in_queue" || c.status === "registered").length,
    processed: candidates.filter(c => c.status === "completed" || c.status === "rejected").length
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-neutral-800">Admin Dashboard</h2>
        <p className="text-neutral-600">Manage walk-in drive interviews and candidates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Total Candidates" 
          value={stats.totalCandidates} 
          icon={<User className="text-primary" />} 
          iconBgColor="bg-blue-100" 
        />
        <StatsCard 
          title="Active Panels" 
          value={stats.activePanels} 
          icon={<Users className="text-green-600" />} 
          iconBgColor="bg-green-100" 
        />
        <StatsCard 
          title="In Queue" 
          value={stats.inQueue} 
          icon={<ListChecks className="text-yellow-600" />} 
          iconBgColor="bg-yellow-100" 
        />
        <StatsCard 
          title="Processed" 
          value={stats.processed} 
          icon={<Check className="text-green-600" />} 
          iconBgColor="bg-green-100" 
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <Tabs defaultValue="candidates" onValueChange={setActiveTab}>
          <div className="border-b border-neutral-200">
            <TabsList className="border-b-0">
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="panels">Panels</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="candidates" className="p-0">
            <CandidateTable candidates={candidates} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="panels" className="p-4">
            <h3 className="text-lg font-medium mb-4">Panel Management</h3>
            <p>This tab will contain panel management features.</p>
          </TabsContent>
          
          <TabsContent value="rooms" className="p-4">
            <h3 className="text-lg font-medium mb-4">Room Allocation</h3>
            <p>This tab will contain room allocation features.</p>
          </TabsContent>
          
          <TabsContent value="reports" className="p-4">
            <h3 className="text-lg font-medium mb-4">Reports</h3>
            <p>This tab will contain reporting features.</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-lg mb-3">Manage Panels</h3>
          <p className="text-neutral-600 text-sm mb-4">Create, edit, or deactivate interview panels.</p>
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full">
            Manage Panels
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-lg mb-3">Room Allocation</h3>
          <p className="text-neutral-600 text-sm mb-4">Assign or modify room allocations for panels.</p>
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full">
            Allocate Rooms
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-lg mb-3">QR Code Scanner</h3>
          <p className="text-neutral-600 text-sm mb-4">Scan candidate QR codes for quick processing.</p>
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full">
            Open Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
