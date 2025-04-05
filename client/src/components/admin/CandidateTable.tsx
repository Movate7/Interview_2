import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Candidate } from "@shared/schema";
import { Search, Filter, X, CheckCircle, Clock, User, BookOpen, UserCheck, FileX } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { assignCandidateToPanel } from "@/lib/googleSheets";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CandidateTableProps {
  candidates: Candidate[];
  isLoading: boolean;
}

// Define filter chips
interface FilterChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: {
    type: 'status' | 'round' | 'position';
    value: string;
  };
  color: string;
}

export default function CandidateTable({ candidates, isLoading }: CandidateTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Define available filter chips
  const filterChips: FilterChip[] = [
    { 
      id: 'registered', 
      label: 'Registered', 
      icon: <User size={14} />, 
      filter: { type: 'status', value: 'registered' },
      color: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
    },
    { 
      id: 'in_queue', 
      label: 'In Queue', 
      icon: <Clock size={14} />, 
      filter: { type: 'status', value: 'in_queue' },
      color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    },
    { 
      id: 'in_process', 
      label: 'In Process', 
      icon: <UserCheck size={14} />, 
      filter: { type: 'status', value: 'in_process' },
      color: 'bg-green-100 text-green-800 hover:bg-green-200'
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      icon: <CheckCircle size={14} />, 
      filter: { type: 'status', value: 'completed' },
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    },
    { 
      id: 'rejected', 
      label: 'Rejected', 
      icon: <FileX size={14} />, 
      filter: { type: 'status', value: 'rejected' },
      color: 'bg-red-100 text-red-800 hover:bg-red-200'
    },
    { 
      id: 'gd', 
      label: 'GD Round', 
      icon: <BookOpen size={14} />, 
      filter: { type: 'round', value: 'gd' },
      color: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
    },
    { 
      id: 'screening', 
      label: 'Screening', 
      icon: <BookOpen size={14} />, 
      filter: { type: 'round', value: 'screening' },
      color: 'bg-teal-100 text-teal-800 hover:bg-teal-200'
    },
    { 
      id: 'manager', 
      label: 'Manager', 
      icon: <BookOpen size={14} />, 
      filter: { type: 'round', value: 'manager' },
      color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
    },
  ];
  
  // Handle filter chip toggle
  const toggleFilterChip = (chipId: string) => {
    setActiveChips(prev => {
      if (prev.includes(chipId)) {
        return prev.filter(id => id !== chipId);
      } else {
        return [...prev, chipId];
      }
    });
  };
  
  // Update filters when chips change
  useEffect(() => {
    // Find active status chips
    const statusChips = activeChips
      .map(id => filterChips.find(chip => chip.id === id))
      .filter(chip => chip?.filter.type === 'status')
      .map(chip => chip?.filter.value);
      
    // Find active round chips
    const roundChips = activeChips
      .map(id => filterChips.find(chip => chip.id === id))
      .filter(chip => chip?.filter.type === 'round')
      .map(chip => chip?.filter.value);
      
    // Update filters based on active chips
    if (statusChips.length === 1) {
      setStatusFilter(statusChips[0] || 'all');
    } else if (statusChips.length === 0) {
      setStatusFilter('all');
    }
    
    if (roundChips.length === 1) {
      setRoundFilter(roundChips[0] || 'all');
    } else if (roundChips.length === 0) {
      setRoundFilter('all');
    }
  }, [activeChips]);

  // Mutation for assigning candidates
  const assignMutation = useMutation({
    mutationFn: ({ candidateId, panelId, roomNo }: { candidateId: number, panelId: number, roomNo: string }) => 
      assignCandidateToPanel(candidateId, panelId, roomNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Candidate assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign candidate",
        variant: "destructive",
      });
    }
  });

  // Filter candidates based on search term and filters
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.serialNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    const matchesRound = roundFilter === "all" || candidate.currentRound === roundFilter;
    
    return matchesSearch && matchesStatus && matchesRound;
  });

  // Row animation handler
  const handleRowHover = (candidateId: number) => {
    setShowAnimation(candidateId);
    setTimeout(() => {
      if (showAnimation === candidateId) {
        setShowAnimation(null);
      }
    }, 2000);
  };

  // Handle assigning a candidate to panel 1 (demo functionality)
  const handleAssign = (candidate: Candidate) => {
    // Show toast confirmation with animation
    toast({
      title: "Assigning candidate...",
      description: (
        <div className="flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-primary"></div>
          <span>Assigning {candidate.name} to Panel 1</span>
        </div>
      ),
    });
    
    // Small delay for visual feedback before actual assignment
    setTimeout(() => {
      assignMutation.mutate({ 
        candidateId: candidate.id, 
        panelId: 1,
        roomNo: "101" 
      });
    }, 500);
  };

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registered":
        return <Badge variant="outline">Registered</Badge>;
      case "in_queue":
        return <Badge variant="secondary">In Queue</Badge>;
      case "in_process":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">In Process</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="in_queue">In Queue</SelectItem>
              <SelectItem value="in_process">In Process</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={roundFilter} onValueChange={setRoundFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              <SelectItem value="gd">GD Round</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="manager">Manager Round</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex w-full sm:w-auto">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          <Button variant="outline" className="ml-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Quick Filter Chips */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <motion.div
              key={chip.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilterChip(chip.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200",
                chip.color,
                activeChips.includes(chip.id) && "ring-2 ring-primary ring-offset-1"
              )}
            >
              <span className="flex items-center gap-1.5">
                {chip.icon}
                <span className="text-sm font-medium">{chip.label}</span>
              </span>
              {activeChips.includes(chip.id) && (
                <X size={14} className="ml-1 opacity-70" />
              )}
            </motion.div>
          ))}
        </div>
        
        {activeChips.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-neutral-500 mt-2 underline hover:text-neutral-700"
            onClick={() => setActiveChips([])}
          >
            Clear all filters
          </motion.button>
        )}
      </div>

      {/* Candidates Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Round</TableHead>
              <TableHead>Panel/Room</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => (
                <motion.tr
                  key={candidate.id}
                  className={cn(
                    "hover:bg-neutral-50 transition-colors duration-150",
                    showAnimation === candidate.id && "bg-blue-50"
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => handleRowHover(candidate.id)}
                  layout
                >
                  <TableCell>
                    <div className="font-mono text-sm text-neutral-900">{candidate.serialNo}</div>
                  </TableCell>
                  <TableCell>
                    <motion.div 
                      className="text-sm font-medium text-neutral-900"
                      initial={false}
                      animate={showAnimation === candidate.id ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {candidate.name}
                    </motion.div>
                    <div className="text-sm text-neutral-500">{candidate.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-neutral-900">{candidate.position}</div>
                  </TableCell>
                  <TableCell>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {getStatusBadge(candidate.status)}
                    </motion.div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {candidate.currentRound.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-neutral-900">
                      {candidate.assignedPanel ? `Panel ${candidate.assignedPanel}` : '-'}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {candidate.roomNo || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <motion.div className="flex">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="ghost" 
                          className="text-primary hover:text-primary-dark mr-3"
                        >
                          View
                        </Button>
                      </motion.div>
                      {candidate.status === "in_queue" || candidate.status === "registered" ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="ghost"
                            className="text-secondary hover:text-secondary-dark"
                            onClick={() => handleAssign(candidate)}
                            disabled={assignMutation.isPending}
                          >
                            Assign
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="ghost"
                            className="text-secondary hover:text-secondary-dark"
                            disabled={candidate.status === "completed" || candidate.status === "rejected"}
                          >
                            Reassign
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && filteredCandidates.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCandidates.length}</span> of <span className="font-medium">{candidates.length}</span> candidates
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button variant="outline" size="icon" disabled className="rounded-l-md">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                <Button variant="outline" className="bg-primary text-white hover:bg-primary-dark">1</Button>
                <Button variant="outline" size="icon" disabled className="rounded-r-md">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
