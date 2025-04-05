import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCandidateSchema, insertPanelSchema, insertFeedbackSchema, insertRoomSchema, insertCandidateFeedbackSchema, insertUserSchema, insertRolePermissionsSchema } from "@shared/schema";
import { WebSocketServer } from "ws";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/app' // Use a specific path to avoid conflicts with Vite
  });
  
  // WebSocket for real-time updates
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Helper function to broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // In a real app, we would use JWT or sessions, but for simplicity:
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    });
  });

  // Candidate routes
  app.get('/api/candidates', async (req, res) => {
    const candidates = await storage.getCandidates();
    res.json(candidates);
  });
  
  app.get('/api/candidates/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const candidate = await storage.getCandidate(id);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  });
  
  app.get('/api/candidates/serial/:serialNo', async (req, res) => {
    const { serialNo } = req.params;
    const candidate = await storage.getCandidateBySerialNo(serialNo);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  });
  
  app.get('/api/candidates/email/:email', async (req, res) => {
    const { email } = req.params;
    const candidate = await storage.getCandidateByEmail(email);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  });
  
  app.post('/api/candidates', async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const newCandidate = await storage.createCandidate(candidateData);
      
      // Broadcast update to all connected clients
      broadcastUpdate('CANDIDATE_CREATED', newCandidate);
      
      res.status(201).json(newCandidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid candidate data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create candidate' });
    }
  });
  
  app.patch('/api/candidates/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const candidateUpdates = req.body;
    
    const updatedCandidate = await storage.updateCandidate(id, candidateUpdates);
    
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('CANDIDATE_UPDATED', updatedCandidate);
    
    res.json(updatedCandidate);
  });

  // Panel routes
  app.get('/api/panels', async (req, res) => {
    const panels = await storage.getPanels();
    res.json(panels);
  });
  
  app.get('/api/panels/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const panel = await storage.getPanel(id);
    
    if (!panel) {
      return res.status(404).json({ message: 'Panel not found' });
    }
    
    res.json(panel);
  });
  
  app.post('/api/panels', async (req, res) => {
    try {
      const panelData = insertPanelSchema.parse(req.body);
      const newPanel = await storage.createPanel(panelData);
      
      // Broadcast update to all connected clients
      broadcastUpdate('PANEL_CREATED', newPanel);
      
      res.status(201).json(newPanel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid panel data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create panel' });
    }
  });
  
  app.patch('/api/panels/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const panelUpdates = req.body;
    
    const updatedPanel = await storage.updatePanel(id, panelUpdates);
    
    if (!updatedPanel) {
      return res.status(404).json({ message: 'Panel not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('PANEL_UPDATED', updatedPanel);
    
    res.json(updatedPanel);
  });

  // Feedback routes
  app.get('/api/feedback/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const feedback = await storage.getFeedback(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(feedback);
  });
  
  app.get('/api/feedback/candidate/:candidateId', async (req, res) => {
    const candidateId = parseInt(req.params.candidateId);
    const feedbacks = await storage.getFeedbackByCandidate(candidateId);
    res.json(feedbacks);
  });
  
  app.post('/api/feedback', async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(req.body);
      const newFeedback = await storage.createFeedback(feedbackData);
      
      // Also update the candidate status based on the feedback
      const candidate = await storage.getCandidate(feedbackData.candidateId);
      if (candidate) {
        let status: string;
        let currentRound: string | undefined;
        
        if (feedbackData.decision === 'next') {
          status = 'in_queue';
          // Convert null or undefined to undefined, but keep the string value if it exists
          currentRound = feedbackData.nextRound === null ? undefined : feedbackData.nextRound;
        } else if (feedbackData.decision === 'reject') {
          status = 'rejected';
        } else {
          status = 'in_queue'; // 'hold' decision
        }
        
        await storage.updateCandidate(candidate.id, { 
          status, 
          ...(currentRound && { currentRound }),
          assignedPanel: null,
        });
      }
      
      // Broadcast update to all connected clients
      broadcastUpdate('FEEDBACK_CREATED', newFeedback);
      
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid feedback data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create feedback' });
    }
  });

  // Google Sheets integration endpoint (for webhook from Google Apps Script)
  app.post('/api/google-sheets/webhook', async (req, res) => {
    try {
      // This endpoint would receive data from Google Sheets
      // when a new candidate registers through the form
      const { name, email, position, timestamp } = req.body;
      
      // Generate serial number (WD-001, WD-002, etc.)
      const candidates = await storage.getCandidates();
      const serialNo = `WD-${(candidates.length + 1).toString().padStart(3, '0')}`;
      
      // Generate QR code URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${serialNo}&size=150x150`;
      
      // Create candidate in our database
      const newCandidate = await storage.createCandidate({
        serialNo,
        name,
        email,
        position,
        timestamp: new Date(timestamp),
        status: 'registered',
        currentRound: 'gd',
        assignedPanel: null,
        roomNo: null,
        qrCodeUrl
      });
      
      // Broadcast update to all connected clients
      broadcastUpdate('CANDIDATE_CREATED', newCandidate);
      
      res.status(201).json(newCandidate);
    } catch (error) {
      console.error('Failed to process Google Sheets webhook:', error);
      res.status(500).json({ message: 'Failed to process Google Sheets data' });
    }
  });
  
  // Google Sheets control endpoint - for initializing and syncing
  app.post('/api/google-sheets/control', async (req, res) => {
    try {
      const { action, candidates } = req.body;
      
      if (action === 'sync') {
        // Update multiple candidates at once from Google Sheets
        if (Array.isArray(candidates)) {
          for (const candidateData of candidates) {
            // Check if candidate exists by email
            const existingCandidate = await storage.getCandidateByEmail(candidateData.email);
            
            if (existingCandidate) {
              // Update the existing candidate
              await storage.updateCandidate(existingCandidate.id, {
                name: candidateData.name,
                position: candidateData.position,
                ...(candidateData.status && { status: candidateData.status }),
                ...(candidateData.currentRound && { currentRound: candidateData.currentRound }),
              });
              
              // Broadcast update
              broadcastUpdate('CANDIDATE_UPDATED', await storage.getCandidate(existingCandidate.id));
            } else {
              // Create a new candidate if not exists
              // Generate serial number
              const allCandidates = await storage.getCandidates();
              const serialNo = `WD-${(allCandidates.length + 1).toString().padStart(3, '0')}`;
              
              // Generate QR code URL
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${serialNo}&size=150x150`;
              
              // Create new candidate
              const newCandidate = await storage.createCandidate({
                serialNo,
                name: candidateData.name,
                email: candidateData.email,
                position: candidateData.position,
                timestamp: new Date(candidateData.timestamp || Date.now()),
                status: candidateData.status || 'registered',
                currentRound: candidateData.currentRound || 'gd',
                assignedPanel: null,
                roomNo: null,
                qrCodeUrl
              });
              
              // Broadcast update
              broadcastUpdate('CANDIDATE_CREATED', newCandidate);
            }
          }
          
          return res.json({ success: true, message: 'Candidates synced successfully' });
        } else {
          return res.status(400).json({ success: false, message: 'Candidates must be an array' });
        }
      } else if (action === 'init') {
        // Initialize connection with Google Sheets
        // This could store some configuration in the future
        return res.json({ success: true, message: 'Connection initialized successfully' });
      } else {
        return res.status(400).json({ success: false, message: 'Unknown action' });
      }
    } catch (error) {
      console.error('Failed to process Google Sheets control:', error);
      res.status(500).json({ success: false, message: 'Failed to process Google Sheets control' });
    }
  });

  // Manual candidate creation endpoint (for testing without Google Sheets)
  app.post('/api/candidates/manual', async (req, res) => {
    try {
      const { name, email, position } = req.body;
      
      if (!name || !email || !position) {
        return res.status(400).json({ message: 'Name, email, and position are required' });
      }
      
      // Generate serial number (WD-001, WD-002, etc.)
      const candidates = await storage.getCandidates();
      const serialNo = `WD-${(candidates.length + 1).toString().padStart(3, '0')}`;
      
      // Generate QR code URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${serialNo}&size=150x150`;
      
      // Create candidate in our database
      const newCandidate = await storage.createCandidate({
        serialNo,
        name,
        email,
        position,
        timestamp: new Date(),
        status: 'registered',
        currentRound: 'gd',
        assignedPanel: null,
        roomNo: null,
        qrCodeUrl
      });
      
      // Broadcast update to all connected clients
      broadcastUpdate('CANDIDATE_CREATED', newCandidate);
      
      res.status(201).json(newCandidate);
    } catch (error) {
      console.error('Failed to create candidate manually:', error);
      res.status(500).json({ message: 'Failed to create candidate' });
    }
  });

  // Room routes
  app.get('/api/rooms', async (req, res) => {
    const rooms = await storage.getRooms();
    res.json(rooms);
  });
  
  app.get('/api/rooms/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const room = await storage.getRoom(id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  });
  
  app.get('/api/rooms/number/:roomNumber', async (req, res) => {
    const { roomNumber } = req.params;
    const room = await storage.getRoomByNumber(roomNumber);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  });
  
  app.post('/api/rooms', async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const newRoom = await storage.createRoom(roomData);
      
      // Broadcast update to all connected clients
      broadcastUpdate('ROOM_CREATED', newRoom);
      
      res.status(201).json(newRoom);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid room data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create room' });
    }
  });
  
  app.patch('/api/rooms/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const roomUpdates = req.body;
    
    const updatedRoom = await storage.updateRoom(id, roomUpdates);
    
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('ROOM_UPDATED', updatedRoom);
    
    res.json(updatedRoom);
  });
  
  app.post('/api/rooms/:roomId/assign-panel/:panelId', async (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const panelId = parseInt(req.params.panelId);
    
    // Check if panel is already assigned to any room
    const rooms = await storage.getRooms();
    const panelAssignedRooms = rooms.filter(room => 
      room.assignedPanels && room.assignedPanels.includes(panelId) && room.id !== roomId
    );
    
    if (panelAssignedRooms.length > 0) {
      // Remove panel from other rooms first
      for (const room of panelAssignedRooms) {
        await storage.removePanelFromRoom(room.id, panelId);
        broadcastUpdate('ROOM_UPDATED', await storage.getRoom(room.id));
      }
    }
    
    // Update panel's roomNo
    const panel = await storage.getPanel(panelId);
    if (panel) {
      const room = await storage.getRoom(roomId);
      if (room) {
        await storage.updatePanel(panelId, { roomNo: room.roomNumber });
      }
    }
    
    const updatedRoom = await storage.assignPanelToRoom(roomId, panelId);
    
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room or panel not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('ROOM_UPDATED', updatedRoom);
    broadcastUpdate('PANEL_UPDATED', await storage.getPanel(panelId));
    
    res.json(updatedRoom);
  });
  
  app.post('/api/rooms/:roomId/remove-panel/:panelId', async (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const panelId = parseInt(req.params.panelId);
    
    // Clear panel's roomNo field
    const panel = await storage.getPanel(panelId);
    if (panel) {
      await storage.updatePanel(panelId, { roomNo: "" });
    }
    
    const updatedRoom = await storage.removePanelFromRoom(roomId, panelId);
    
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room or panel not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('ROOM_UPDATED', updatedRoom);
    broadcastUpdate('PANEL_UPDATED', await storage.getPanel(panelId));
    
    res.json(updatedRoom);
  });

  // Candidate Feedback routes (post-interview feedback from candidates)
  app.get('/api/candidate-feedback', async (req, res) => {
    const feedbacks = await storage.getCandidateFeedbacks();
    res.json(feedbacks);
  });
  
  app.get('/api/candidate-feedback/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const feedback = await storage.getCandidateFeedback(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Candidate feedback not found' });
    }
    
    res.json(feedback);
  });
  
  app.get('/api/candidate-feedback/candidate/:candidateId', async (req, res) => {
    const candidateId = parseInt(req.params.candidateId);
    const feedback = await storage.getCandidateFeedbackByCandidate(candidateId);
    
    if (!feedback) {
      return res.status(404).json({ message: 'No feedback found for this candidate' });
    }
    
    res.json(feedback);
  });
  
  app.post('/api/candidate-feedback', async (req, res) => {
    try {
      const feedbackData = insertCandidateFeedbackSchema.parse(req.body);
      const newFeedback = await storage.createCandidateFeedback(feedbackData);
      
      // Broadcast update to all connected clients
      broadcastUpdate('CANDIDATE_FEEDBACK_CREATED', newFeedback);
      
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid feedback data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create candidate feedback' });
    }
  });

  // User management routes
  app.get('/api/users', async (req, res) => {
    const users = await storage.getUsers();
    
    // Remove password from response for security
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  });
  
  app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response for security
    const { password, ...safeUser } = user;
    
    res.json(safeUser);
  });
  
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      
      // Remove password from response for security
      const { password, ...safeUser } = newUser;
      
      // Broadcast update to all connected clients
      broadcastUpdate('USER_CREATED', safeUser);
      
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  app.patch('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const userUpdates = req.body;
    
    const updatedUser = await storage.updateUser(id, userUpdates);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response for security
    const { password, ...safeUser } = updatedUser;
    
    // Broadcast update to all connected clients
    broadcastUpdate('USER_UPDATED', safeUser);
    
    res.json(safeUser);
  });
  
  app.delete('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('USER_DELETED', { id });
    
    res.json({ success: true });
  });
  
  // Role Permissions routes
  app.get('/api/role-permissions', async (req, res) => {
    const rolePermissions = await storage.getRolePermissions();
    res.json(rolePermissions);
  });
  
  app.get('/api/role-permissions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const rolePermission = await storage.getRolePermission(id);
    
    if (!rolePermission) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    res.json(rolePermission);
  });
  
  app.get('/api/role-permissions/role/:role', async (req, res) => {
    const { role } = req.params;
    const rolePermission = await storage.getRolePermissionByRole(role);
    
    if (!rolePermission) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    res.json(rolePermission);
  });
  
  app.post('/api/role-permissions', async (req, res) => {
    try {
      const rolePermissionData = insertRolePermissionsSchema.parse(req.body);
      const newRolePermission = await storage.createRolePermission(rolePermissionData);
      
      // Broadcast update to all connected clients
      broadcastUpdate('ROLE_PERMISSION_CREATED', newRolePermission);
      
      res.status(201).json(newRolePermission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid role permission data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create role permission' });
    }
  });
  
  app.patch('/api/role-permissions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const rolePermissionUpdates = req.body;
    
    const updatedRolePermission = await storage.updateRolePermission(id, rolePermissionUpdates);
    
    if (!updatedRolePermission) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('ROLE_PERMISSION_UPDATED', updatedRolePermission);
    
    res.json(updatedRolePermission);
  });
  
  app.delete('/api/role-permissions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteRolePermission(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Role permission not found' });
    }
    
    // Broadcast update to all connected clients
    broadcastUpdate('ROLE_PERMISSION_DELETED', { id });
    
    res.json({ success: true });
  });

  return httpServer;
}
