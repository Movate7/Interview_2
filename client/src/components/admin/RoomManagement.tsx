import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Panel } from "@shared/schema";

// Room form schema
const roomFormSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  capacity: z.string().min(1, "Capacity is required"),
  floor: z.string().min(1, "Floor is required"),
  type: z.enum(["Technical", "HR", "Manager", "General"]),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

// Room type for our application
interface Room {
  id: number;
  roomNumber: string;
  capacity: number;
  floor: string;
  type: "Technical" | "HR" | "Manager" | "General";
  isOccupied: boolean;
  assignedPanels: number[];
}

export default function RoomManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  
  // Fetch panels for room assignment
  const { data: panels = [] } = useQuery({
    queryKey: ['/api/panels'],
    queryFn: async () => {
      const response = await fetch('/api/panels', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch panels');
      }
      
      return response.json() as Promise<Panel[]>;
    },
  });
  
  // Fetch rooms from the API
  const { 
    data: rooms = [], 
    isLoading: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['/api/rooms'],
    queryFn: async () => {
      const response = await fetch('/api/rooms', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      return response.json() as Promise<Room[]>;
    },
  });
  
  // Form for adding new rooms
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      roomNumber: "",
      capacity: "",
      floor: "",
      type: "General",
    },
  });
  
  // Mutation for adding a new room
  const addRoomMutation = useMutation({
    mutationFn: async (roomData: { 
      roomNumber: string, 
      capacity: number, 
      floor: string, 
      type: string 
    }) => {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch rooms
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      
      // Reset form and close dialog
      roomForm.reset();
      setIsAddRoomOpen(false);
      
      toast({
        title: "Room Added",
        description: "Room has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add room",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for assigning a panel to a room
  const assignPanelMutation = useMutation({
    mutationFn: async ({ roomId, panelId }: { roomId: number, panelId: number }) => {
      const response = await fetch(`/api/rooms/${roomId}/assign-panel/${panelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign panel to room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch rooms and panels
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/panels'] });
      
      toast({
        title: "Panel Assigned",
        description: "Panel has been assigned to the room successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign panel to room",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for removing a panel from a room
  const removePanelMutation = useMutation({
    mutationFn: async ({ roomId, panelId }: { roomId: number, panelId: number }) => {
      const response = await fetch(`/api/rooms/${roomId}/remove-panel/${panelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove panel from room');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch rooms and panels
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/panels'] });
      
      toast({
        title: "Panel Removed",
        description: "Panel has been removed from the room successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove panel from room",
        variant: "destructive",
      });
    }
  });
  
  // Handler for adding a new room
  const onAddRoom = (data: RoomFormValues) => {
    // Execute the mutation to add the room
    addRoomMutation.mutate({
      roomNumber: data.roomNumber,
      capacity: parseInt(data.capacity),
      floor: data.floor,
      type: data.type,
    });
    
    // Show loading toast
    toast({
      title: "Adding Room",
      description: "Please wait while we add the room...",
    });
  };
  
  // Handler for assigning a panel to a room
  const handleAssignPanelToRoom = (roomId: number, panelId: number) => {
    assignPanelMutation.mutate({ roomId, panelId });
  };
  
  // Handler for removing a panel from a room
  const handleRemovePanelFromRoom = (roomId: number, panelId: number) => {
    removePanelMutation.mutate({ roomId, panelId });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Room Management</h2>
        
        <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
          <DialogTrigger asChild>
            <Button>
              Add New Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="space-y-4">
                <FormField
                  control={roomForm.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 5" 
                          type="number" 
                          min="1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1st" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={roomForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md"
                          {...field}
                        >
                          <option value="Technical">Technical</option>
                          <option value="HR">HR</option>
                          <option value="Manager">Manager</option>
                          <option value="General">General</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit">Add Room</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className={`${room.isOccupied ? 'border-amber-200' : 'border-green-200'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Room #{room.roomNumber}</CardTitle>
                <Badge variant={room.isOccupied ? "outline" : "secondary"}>
                  {room.isOccupied ? "Occupied" : "Available"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-neutral-500">Capacity:</div>
                  <div>{room.capacity} people</div>
                  
                  <div className="text-neutral-500">Floor:</div>
                  <div>{room.floor}</div>
                  
                  <div className="text-neutral-500">Type:</div>
                  <div>{room.type}</div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm font-medium text-neutral-500 mb-2">
                    Assigned Panels:
                  </div>
                  {room.assignedPanels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {room.assignedPanels.map((panelId) => {
                        const panel = panels.find(p => p.id === panelId);
                        return (
                          <div key={panelId} className="flex items-center gap-1">
                            <Badge variant="secondary">
                              {panel ? panel.name : `Panel ${panelId}`}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 text-red-500"
                              onClick={() => handleRemovePanelFromRoom(room.id, panelId)}
                            >
                              ×
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-400">No panels assigned</div>
                  )}
                  
                  <div className="mt-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2">
                          Assign Panel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Panel to Room {room.roomNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <div className="font-medium">Available Panels</div>
                            {panels
                              .filter(panel => !room.assignedPanels.includes(panel.id))
                              .map(panel => (
                                <div key={panel.id} className="flex items-center justify-between border p-2 rounded-md">
                                  <div>
                                    <div className="font-medium">{panel.name}</div>
                                    <div className="text-sm text-neutral-500">
                                      {panel.isActive ? "Active" : "Inactive"}
                                      {panel.roomNo && ` - Room ${panel.roomNo}`}
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssignPanelToRoom(room.id, panel.id)}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              ))}
                            {panels.filter(panel => !room.assignedPanels.includes(panel.id)).length === 0 && (
                              <div className="text-neutral-500 text-sm">No available panels to assign</div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}