import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Panel } from "@shared/schema";

export default function PanelManagement() {
  const [newPanelName, setNewPanelName] = useState("");
  const [newRoomNo, setNewRoomNo] = useState("");
  const { toast } = useToast();

  // Fetch panels
  const { data: panels = [], isLoading } = useQuery({
    queryKey: ["/api/panels"],
    queryFn: async () => {
      const response = await fetch("/api/panels");
      if (!response.ok) {
        throw new Error("Failed to fetch panels");
      }
      return response.json();
    }
  });

  // Create panel mutation
  const createPanelMutation = useMutation({
    mutationFn: async (panelData: { name: string; roomNo: string }) => {
      const response = await apiRequest("POST", "/api/panels", {
        ...panelData,
        isActive: true,
        panelMembers: ["Panel Member"] // In a real app, we'd select actual users
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      setNewPanelName("");
      setNewRoomNo("");
      toast({
        title: "Success",
        description: "New panel created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create panel",
        variant: "destructive",
      });
    }
  });

  // Toggle panel status mutation
  const togglePanelMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/panels/${id}`, {
        isActive
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panels"] });
      toast({
        title: "Success",
        description: "Panel status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update panel status",
        variant: "destructive",
      });
    }
  });

  const handleCreatePanel = () => {
    if (!newPanelName || !newRoomNo) {
      toast({
        title: "Error",
        description: "Panel name and room number are required",
        variant: "destructive",
      });
      return;
    }

    createPanelMutation.mutate({
      name: newPanelName,
      roomNo: newRoomNo
    });
  };

  const togglePanelStatus = (panel: Panel) => {
    togglePanelMutation.mutate({
      id: panel.id,
      isActive: !panel.isActive
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium text-neutral-800">Panel Management</h2>
          <p className="text-neutral-600">Create and manage interview panels</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Panel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Panel</DialogTitle>
              <DialogDescription>
                Add a new interview panel to the system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="panel-name" className="text-right">
                  Panel Name
                </Label>
                <Input
                  id="panel-name"
                  value={newPanelName}
                  onChange={(e) => setNewPanelName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. Technical Panel 1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room-no" className="text-right">
                  Room Number
                </Label>
                <Input
                  id="room-no"
                  value={newRoomNo}
                  onChange={(e) => setNewRoomNo(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. 101"
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleCreatePanel}
                disabled={createPanelMutation.isPending}
              >
                {createPanelMutation.isPending ? "Creating..." : "Create Panel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : panels.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-neutral-600">No panels found. Create your first panel to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {panels.map((panel: Panel) => (
            <Card key={panel.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{panel.name}</CardTitle>
                  <Badge
                    variant={panel.isActive ? "success" : "secondary"}
                    className={panel.isActive ? "bg-green-100 text-green-800" : ""}
                  >
                    {panel.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500">Room Number</p>
                    <p className="font-medium">{panel.roomNo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500">Panel Members</p>
                    <ul className="mt-1">
                      {panel.panelMembers.map((member, index) => (
                        <li key={index} className="text-sm">{member}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => togglePanelStatus(panel)}
                      disabled={togglePanelMutation.isPending}
                    >
                      {panel.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" className="flex-1">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
