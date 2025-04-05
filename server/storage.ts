import { candidates, feedback, panels, rooms, users, candidateFeedback, rolePermissions } from "@shared/schema";
import type { 
  User, InsertUser, 
  Candidate, InsertCandidate, 
  Panel, InsertPanel, 
  Feedback, InsertFeedback, 
  Room, InsertRoom, 
  CandidateFeedback, InsertCandidateFeedback,
  RolePermission, InsertRolePermission
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Candidate methods
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateBySerialNo(serialNo: string): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  
  // Panel methods
  getPanels(): Promise<Panel[]>;
  getPanel(id: number): Promise<Panel | undefined>;
  createPanel(panel: InsertPanel): Promise<Panel>;
  updatePanel(id: number, updates: Partial<Panel>): Promise<Panel | undefined>;
  
  // Feedback methods
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbackByCandidate(candidateId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Room methods
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  assignPanelToRoom(roomId: number, panelId: number): Promise<Room | undefined>;
  removePanelFromRoom(roomId: number, panelId: number): Promise<Room | undefined>;
  
  // Candidate Feedback methods (post-interview feedback from candidates)
  getCandidateFeedbacks(): Promise<CandidateFeedback[]>;
  getCandidateFeedback(id: number): Promise<CandidateFeedback | undefined>;
  getCandidateFeedbackByCandidate(candidateId: number): Promise<CandidateFeedback | undefined>;
  createCandidateFeedback(feedback: InsertCandidateFeedback): Promise<CandidateFeedback>;
  
  // Role Permissions methods
  getRolePermissions(): Promise<RolePermission[]>;
  getRolePermission(id: number): Promise<RolePermission | undefined>;
  getRolePermissionByRole(role: string): Promise<RolePermission | undefined>;
  createRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: number, updates: Partial<RolePermission>): Promise<RolePermission | undefined>;
  deleteRolePermission(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private candidates: Map<number, Candidate>;
  private panels: Map<number, Panel>;
  private feedbacks: Map<number, Feedback>;
  private rooms: Map<number, Room>;
  private candidateFeedbacks: Map<number, CandidateFeedback>;
  private rolePermissions: Map<number, RolePermission>;
  private userCurrentId: number;
  private candidateCurrentId: number;
  private panelCurrentId: number;
  private feedbackCurrentId: number;
  private roomCurrentId: number;
  private candidateFeedbackCurrentId: number;
  private rolePermissionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.candidates = new Map();
    this.panels = new Map();
    this.feedbacks = new Map();
    this.rooms = new Map();
    this.candidateFeedbacks = new Map();
    this.rolePermissions = new Map();
    this.userCurrentId = 1;
    this.candidateCurrentId = 1;
    this.panelCurrentId = 1;
    this.feedbackCurrentId = 1;
    this.roomCurrentId = 1;
    this.candidateFeedbackCurrentId = 1;
    this.rolePermissionCurrentId = 1;
    
    // Add some initial data for demo purposes
    this.initializeData();
  }

  private initializeData() {
    // Create role permissions
    this.createRolePermission({
      role: "admin",
      permissions: JSON.stringify({
        viewCandidates: true,
        manageCandidates: true,
        viewPanels: true,
        managePanels: true,
        viewRooms: true,
        manageRooms: true,
        viewFeedback: true,
        provideFeedback: true,
        viewAnalytics: true,
        manageUsers: true,
        managePermissions: true
      }),
      description: "Full administrative access"
    });
    
    this.createRolePermission({
      role: "panel",
      permissions: JSON.stringify({
        viewCandidates: true,
        manageCandidates: false,
        viewPanels: false,
        managePanels: false,
        viewRooms: true,
        manageRooms: false,
        viewFeedback: false,
        provideFeedback: true,
        viewAnalytics: false,
        manageUsers: false,
        managePermissions: false
      }),
      description: "Panel member with access to interview candidates"
    });
    
    this.createRolePermission({
      role: "operations_lead",
      permissions: JSON.stringify({
        viewCandidates: true,
        manageCandidates: true,
        viewPanels: true,
        managePanels: true,
        viewRooms: true,
        manageRooms: true,
        viewFeedback: true,
        provideFeedback: false,
        viewAnalytics: true,
        manageUsers: false,
        managePermissions: false
      }),
      description: "Operations lead with access to manage panels and rooms"
    });
    
    this.createRolePermission({
      role: "hr",
      permissions: JSON.stringify({
        viewCandidates: true,
        manageCandidates: false,
        viewPanels: true,
        managePanels: false,
        viewRooms: true,
        manageRooms: false,
        viewFeedback: true,
        provideFeedback: false,
        viewAnalytics: true,
        manageUsers: false,
        managePermissions: false
      }),
      description: "HR personnel with limited access"
    });
    
    // Add admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "Admin User",
      email: "admin@example.com",
      permissions: [],  // Using global role permissions
      isActive: true
    });
    
    // Add panel user
    this.createUser({
      username: "panel1",
      password: "panel123",
      role: "panel",
      name: "Panel User",
      email: "panel@example.com",
      permissions: [],  // Using global role permissions
      isActive: true
    });
    
    // Add HR user
    this.createUser({
      username: "hr1",
      password: "hr123",
      role: "hr",
      name: "HR User",
      email: "hr@example.com",
      permissions: ["view_all_feedback"], // Override permission
      isActive: true
    });
    
    // Add operations lead user
    this.createUser({
      username: "ops1",
      password: "ops123",
      role: "operations_lead",
      name: "Operations Lead",
      email: "ops@example.com",
      permissions: [],  // Using global role permissions
      isActive: true
    });
    
    // Create a panel
    const panel = this.createPanel({
      name: "Panel 1",
      roomNo: "101",
      isActive: true,
      currentCandidate: null,
      panelMembers: ["Panel User"]
    });
    
    // Create rooms
    const room1 = this.createRoom({
      roomNumber: "101",
      capacity: 5,
      floor: "1st",
      type: "Technical",
      isOccupied: true,
      assignedPanels: [1] // Assuming panel ID is 1
    });
    
    this.createRoom({
      roomNumber: "102",
      capacity: 3,
      floor: "1st",
      type: "HR",
      isOccupied: false,
      assignedPanels: []
    });
    
    this.createRoom({
      roomNumber: "201",
      capacity: 8,
      floor: "2nd",
      type: "Manager",
      isOccupied: false,
      assignedPanels: []
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    // Ensure role is always defined
    const role = insertUser.role || 'panel';
    // Set default values for new fields
    const permissions = insertUser.permissions || [];
    const isActive = insertUser.isActive ?? true;
    const createdAt = new Date();
    
    const user: User = { 
      ...insertUser, 
      id,
      role,
      permissions,
      isActive,
      createdAt
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Candidate methods
  async getCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async getCandidateBySerialNo(serialNo: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.serialNo === serialNo,
    );
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    return Array.from(this.candidates.values()).find(
      (candidate) => candidate.email === email,
    );
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateCurrentId++;
    // Ensure required fields are present
    const status = insertCandidate.status || 'registered';
    const currentRound = insertCandidate.currentRound || 'gd';
    const assignedPanel = insertCandidate.assignedPanel ?? null;
    const roomNo = insertCandidate.roomNo ?? null;
    const qrCodeUrl = insertCandidate.qrCodeUrl ?? null;
    
    const candidate: Candidate = { 
      ...insertCandidate, 
      id,
      status,
      currentRound,
      assignedPanel,
      roomNo,
      qrCodeUrl
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    const existing = this.candidates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.candidates.set(id, updated);
    return updated;
  }

  // Panel methods
  async getPanels(): Promise<Panel[]> {
    return Array.from(this.panels.values());
  }

  async getPanel(id: number): Promise<Panel | undefined> {
    return this.panels.get(id);
  }

  async createPanel(insertPanel: InsertPanel): Promise<Panel> {
    const id = this.panelCurrentId++;
    // Ensure required fields are present
    const isActive = insertPanel.isActive ?? true;
    const currentCandidate = insertPanel.currentCandidate ?? null;
    
    const panel: Panel = { 
      ...insertPanel, 
      id,
      isActive,
      currentCandidate
    };
    this.panels.set(id, panel);
    return panel;
  }

  async updatePanel(id: number, updates: Partial<Panel>): Promise<Panel | undefined> {
    const existing = this.panels.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.panels.set(id, updated);
    return updated;
  }

  // Feedback methods
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbackByCandidate(candidateId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      (feedback) => feedback.candidateId === candidateId,
    );
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackCurrentId++;
    // Ensure nextRound is string | null, not undefined
    const nextRound = insertFeedback.nextRound ?? null;
    
    const feedback: Feedback = { 
      ...insertFeedback, 
      id, 
      nextRound 
    };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.roomNumber === roomNumber,
    );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomCurrentId++;
    // Ensure required fields are present
    const isOccupied = insertRoom.isOccupied ?? false;
    const assignedPanels = insertRoom.assignedPanels ?? [];
    
    const room: Room = { 
      ...insertRoom, 
      id,
      isOccupied,
      assignedPanels
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const existing = this.rooms.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.rooms.set(id, updated);
    return updated;
  }

  async assignPanelToRoom(roomId: number, panelId: number): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    
    // Check if panel exists
    const panel = this.panels.get(panelId);
    if (!panel) return undefined;
    
    // Make sure assignedPanels is an array
    const currentAssignedPanels = room.assignedPanels || [];
    
    // Check if panel is already assigned to this room
    if (currentAssignedPanels.includes(panelId)) {
      return room; // Panel already assigned, no change needed
    }
    
    // Add panel to room
    const updatedAssignedPanels = [...currentAssignedPanels, panelId];
    const updated = { 
      ...room, 
      assignedPanels: updatedAssignedPanels,
      isOccupied: true // Room is now occupied since it has an assigned panel
    };
    
    this.rooms.set(roomId, updated);
    
    // Update panel's roomNo
    await this.updatePanel(panelId, { roomNo: room.roomNumber });
    
    return updated;
  }

  async removePanelFromRoom(roomId: number, panelId: number): Promise<Room | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    
    // Make sure assignedPanels is an array
    const currentAssignedPanels = room.assignedPanels || [];
    
    // Check if panel is assigned to this room
    if (!currentAssignedPanels.includes(panelId)) {
      return room; // Panel not assigned, no change needed
    }
    
    // Remove panel from room
    const updatedAssignedPanels = currentAssignedPanels.filter(id => id !== panelId);
    const updated = { 
      ...room, 
      assignedPanels: updatedAssignedPanels,
      isOccupied: updatedAssignedPanels.length > 0 // Room is occupied only if it has assigned panels
    };
    
    this.rooms.set(roomId, updated);
    
    // Update panel's roomNo if it exists
    const panel = this.panels.get(panelId);
    if (panel && panel.roomNo === room.roomNumber) {
      await this.updatePanel(panelId, { roomNo: "" });
    }
    
    return updated;
  }
  
  // Candidate Feedback methods (post-interview feedback from candidates)
  async getCandidateFeedbacks(): Promise<CandidateFeedback[]> {
    return Array.from(this.candidateFeedbacks.values());
  }

  async getCandidateFeedback(id: number): Promise<CandidateFeedback | undefined> {
    return this.candidateFeedbacks.get(id);
  }

  async getCandidateFeedbackByCandidate(candidateId: number): Promise<CandidateFeedback | undefined> {
    return Array.from(this.candidateFeedbacks.values()).find(
      (feedback) => feedback.candidateId === candidateId,
    );
  }

  async createCandidateFeedback(insertFeedback: InsertCandidateFeedback): Promise<CandidateFeedback> {
    const id = this.candidateFeedbackCurrentId++;
    
    // Handle optional text fields
    const reasonsRating = insertFeedback.reasonsRating ?? null;
    const improvementSuggestions = insertFeedback.improvementSuggestions ?? null;
    const comparisonToOthers = insertFeedback.comparisonToOthers ?? null;
    const additionalComments = insertFeedback.additionalComments ?? null;
    
    // Create timestamp if not provided
    const submittedAt = new Date();
    
    const feedback: CandidateFeedback = { 
      ...insertFeedback, 
      id,
      reasonsRating,
      improvementSuggestions,
      comparisonToOthers,
      additionalComments,
      submittedAt,
      anonymous: insertFeedback.anonymous ?? false
    };
    
    this.candidateFeedbacks.set(id, feedback);
    return feedback;
  }

  // Role Permissions methods
  async getRolePermissions(): Promise<RolePermission[]> {
    return Array.from(this.rolePermissions.values());
  }

  async getRolePermission(id: number): Promise<RolePermission | undefined> {
    return this.rolePermissions.get(id);
  }

  async getRolePermissionByRole(role: string): Promise<RolePermission | undefined> {
    return Array.from(this.rolePermissions.values()).find(
      (rolePermission) => rolePermission.role === role
    );
  }

  async createRolePermission(insertRolePermission: InsertRolePermission): Promise<RolePermission> {
    const id = this.rolePermissionCurrentId++;
    const now = new Date();
    
    const rolePermission: RolePermission = {
      id,
      role: insertRolePermission.role,
      permissions: insertRolePermission.permissions,
      description: insertRolePermission.description ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.rolePermissions.set(id, rolePermission);
    return rolePermission;
  }

  async updateRolePermission(id: number, updates: Partial<RolePermission>): Promise<RolePermission | undefined> {
    const existing = this.rolePermissions.get(id);
    if (!existing) return undefined;
    
    // Always update the updatedAt timestamp
    const updated = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    
    this.rolePermissions.set(id, updated);
    return updated;
  }

  async deleteRolePermission(id: number): Promise<boolean> {
    return this.rolePermissions.delete(id);
  }
}

export const storage = new MemStorage();
