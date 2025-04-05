import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (admins and panel members)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("panel"), // "admin" or "panel"
  name: text("name").notNull(),
  email: text("email").notNull(),
  permissions: text("permissions").array().default([]), // Array of permission strings
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
  permissions: true,
  isActive: true,
});

// Candidate schema
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  serialNo: text("serial_no").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  position: text("position").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull().default("registered"), // "registered", "in_queue", "in_process", "completed", "rejected"
  currentRound: text("current_round").notNull().default("gd"), // "gd", "screening", "manager"
  assignedPanel: integer("assigned_panel"),
  roomNo: text("room_no"),
  qrCodeUrl: text("qr_code_url"),
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  serialNo: true,
  name: true,
  email: true,
  position: true,
  timestamp: true,
  status: true,
  currentRound: true,
  assignedPanel: true,
  roomNo: true,
  qrCodeUrl: true,
});

// Panel schema
export const panels = pgTable("panels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  roomNo: text("room_no").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  currentCandidate: integer("current_candidate"),
  panelMembers: text("panel_members").array().notNull(),
});

export const insertPanelSchema = createInsertSchema(panels).pick({
  name: true,
  roomNo: true,
  isActive: true,
  currentCandidate: true,
  panelMembers: true,
});

// Feedback schema
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  panelId: integer("panel_id").notNull(),
  round: text("round").notNull(),
  technicalSkills: text("technical_skills").notNull(),
  communication: text("communication").notNull(),
  detailedFeedback: text("detailed_feedback").notNull(),
  decision: text("decision").notNull(), // "next", "reject", "hold"
  nextRound: text("next_round"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  candidateId: true,
  panelId: true,
  round: true,
  technicalSkills: true,
  communication: true,
  detailedFeedback: true,
  decision: true,
  nextRound: true,
  createdAt: true,
});

// Room schema
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  floor: text("floor").notNull(),
  type: text("type").notNull(), // "Technical", "HR", "Manager", "General"
  isOccupied: boolean("is_occupied").notNull().default(false),
  assignedPanels: integer("assigned_panels").array().default([]),
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  roomNumber: true,
  capacity: true,
  floor: true,
  type: true,
  isOccupied: true,
  assignedPanels: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Panel = typeof panels.$inferSelect;
export type InsertPanel = z.infer<typeof insertPanelSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Candidate Feedback schema (post-interview feedback from candidates)
export const candidateFeedback = pgTable("candidate_feedback", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  overallExperience: integer("overall_experience").notNull(), // 1-5 scale
  interviewDifficulty: integer("interview_difficulty").notNull(), // 1-5 scale
  interviewFairness: integer("interview_fairness").notNull(), // 1-5 scale
  interviewerProfessionalism: integer("interviewer_professionalism").notNull(), // 1-5 scale
  reasonsRating: text("reasons_rating"), // Why they gave this rating
  improvementSuggestions: text("improvement_suggestions"), // How the process could be improved
  comparisonToOthers: text("comparison_to_others"), // How it compares to other interviews
  additionalComments: text("additional_comments"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  anonymous: boolean("anonymous").notNull().default(false),
});

export const insertCandidateFeedbackSchema = createInsertSchema(candidateFeedback).pick({
  candidateId: true,
  overallExperience: true,
  interviewDifficulty: true,
  interviewFairness: true,
  interviewerProfessionalism: true,
  reasonsRating: true,
  improvementSuggestions: true,
  comparisonToOthers: true,
  additionalComments: true,
  anonymous: true,
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type CandidateFeedback = typeof candidateFeedback.$inferSelect;
export type InsertCandidateFeedback = z.infer<typeof insertCandidateFeedbackSchema>;

// Permissions interface for structured permissions
export interface Permissions {
  viewCandidates: boolean;
  manageCandidates: boolean;
  viewPanels: boolean;
  managePanels: boolean;
  viewRooms: boolean;
  manageRooms: boolean;
  viewFeedback: boolean;
  provideFeedback: boolean;
  viewAnalytics: boolean;
  manageUsers: boolean;
  managePermissions: boolean;
}

// Role Permissions schema (global role settings)
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull().unique(), // "admin", "panel", "hr", "operations_lead", "operations_manager"
  // Store serialized permissions object
  permissions: text("permissions").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRolePermissionsSchema = createInsertSchema(rolePermissions).pick({
  role: true,
  permissions: true,
  description: true,
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionsSchema>;
