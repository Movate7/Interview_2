import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Candidate } from "@shared/schema";
import { updateCandidateStatus } from "@/lib/googleSheets";

// Define the pipeline stages
const stages = [
  { id: "registered", name: "Registered", color: "bg-blue-100 text-blue-800" },
  { id: "screening", name: "Initial Screening", color: "bg-purple-100 text-purple-800" },
  { id: "technical", name: "Technical Round", color: "bg-amber-100 text-amber-800" },
  { id: "hr", name: "HR Round", color: "bg-green-100 text-green-800" },
  { id: "selected", name: "Selected", color: "bg-emerald-100 text-emerald-800" },
  { id: "rejected", name: "Rejected", color: "bg-red-100 text-red-800" }
];

interface KanbanBoardProps {
  candidates: Candidate[];
  isLoading: boolean;
  refetch: () => void;
}

export default function KanbanBoard({ candidates, isLoading, refetch }: KanbanBoardProps) {
  const { toast } = useToast();
  const [columns, setColumns] = useState<{ [key: string]: Candidate[] }>({});
  
  // Initialize columns with candidates grouped by status
  useEffect(() => {
    if (!candidates.length) return;
    
    const newColumns: { [key: string]: Candidate[] } = {};
    
    // Initialize all stages with empty arrays
    stages.forEach(stage => {
      newColumns[stage.id] = [];
    });
    
    // Group candidates by their status
    candidates.forEach(candidate => {
      const status = candidate.status || "registered";
      if (newColumns[status]) {
        newColumns[status].push(candidate);
      } else {
        newColumns["registered"].push(candidate);
      }
    });
    
    setColumns(newColumns);
  }, [candidates]);
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Moving within the same column
    if (source.droppableId === destination.droppableId) {
      const column = columns[source.droppableId];
      const newItems = Array.from(column);
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: newItems
      });
      return;
    }
    
    // Moving from one column to another
    const candidateId = Number(draggableId);
    const candidate = candidates.find(c => c.id === candidateId);
    
    if (!candidate) {
      toast({
        title: "Error",
        description: "Candidate not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update the candidate status in the backend
      await updateCandidateStatus(candidateId, destination.droppableId);
      
      // Update local state for immediate UI update
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      
      const sourceItems = Array.from(sourceColumn);
      const destItems = Array.from(destColumn);
      
      const [removed] = sourceItems.splice(source.index, 1);
      // Update the status properly with type safety
      const updatedCandidate = { ...removed };
      updatedCandidate.status = destination.droppableId;
      destItems.splice(destination.index, 0, updatedCandidate);
      
      setColumns({
        ...columns,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems
      });
      
      toast({
        title: "Status Updated",
        description: `${candidate.name} moved to ${stages.find(s => s.id === destination.droppableId)?.name}`
      });
      
      // Refetch candidates to ensure data consistency
      refetch();
    } catch (error) {
      console.error("Error updating candidate status:", error);
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!candidates.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-neutral-500">No candidates found</h3>
        <p className="text-neutral-400 mt-2">Candidates will appear here once they register</p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[900px]">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-6 gap-4">
            {stages.map((stage) => (
              <div key={stage.id} className="flex flex-col">
                <div className={`mb-2 p-2 rounded-md ${stage.color} font-medium text-center`}>
                  {stage.name}
                  <span className="ml-2 bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs">
                    {columns[stage.id]?.length || 0}
                  </span>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-neutral-50 rounded-md min-h-[500px] p-2"
                    >
                      {columns[stage.id]?.map((candidate, index) => (
                        <Draggable 
                          key={candidate.id.toString()} 
                          draggableId={candidate.id.toString()} 
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <CardHeader className="p-3 pb-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarFallback>
                                        {candidate.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-sm font-medium">
                                      {candidate.name}
                                    </CardTitle>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.serialNo}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-2">
                                <p className="text-xs text-neutral-500 truncate">
                                  {candidate.email}
                                </p>
                                <p className="text-xs text-neutral-600 mt-1 font-medium">
                                  {candidate.position}
                                </p>
                                {candidate.assignedPanel && (
                                  <Badge variant="secondary" className="mt-2 text-xs">
                                    Panel {candidate.assignedPanel}
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}