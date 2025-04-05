import { Candidate } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Configuration constants for Google Sheets integration
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

// This file contains functions to interact with our backend API and Google Sheets via Apps Script

/**
 * Initialize Google Sheets connection with Apps Script
 * This will set up the webhook to our /api/google-sheets/webhook endpoint
 */
export async function initializeGoogleSheetsConnection(): Promise<boolean> {
  try {
    // First call our backend to notify about initialization
    const backendResponse = await apiRequest("POST", "/api/google-sheets/control", {
      action: 'init',
    });

    if (!backendResponse.ok) {
      throw new Error('Failed to initialize Google Sheets connection with backend');
    }

    // Then, if we have a Google Script URL, set up the webhook
    if (!GOOGLE_SCRIPT_URL) {
      console.warn("Google Apps Script URL not configured - skipping Apps Script initialization");
      // Even without the script URL, we consider this a success since the backend is configured
      return true;
    }

    // Call the Google Apps Script web app to set up the webhook
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'setupWebhook',
        webhookUrl: `${window.location.origin}/api/google-sheets/webhook`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize Google Sheets connection with Apps Script');
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error initializing Google Sheets connection:', error);
    return false;
  }
}

/**
 * Creates a candidate manually (for testing without Google Forms)
 */
export async function createCandidateManually(data: {
  name: string;
  email: string;
  position: string;
}) {
  const response = await apiRequest("POST", "/api/candidates/manual", data);
  return response.json();
}

/**
 * Fetches all candidates from the system
 */
export async function fetchCandidates(): Promise<Candidate[]> {
  const response = await fetch("/api/candidates", {
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch candidates");
  }
  
  return response.json();
}

/**
 * Fetches a candidate by serial number
 */
export async function fetchCandidateBySerialNo(serialNo: string): Promise<Candidate> {
  const response = await fetch(`/api/candidates/serial/${serialNo}`, {
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch candidate");
  }
  
  return response.json();
}

/**
 * Fetches a candidate by email address
 */
export async function fetchCandidateByEmail(email: string): Promise<Candidate> {
  const response = await fetch(`/api/candidates/email/${email}`, {
    credentials: "include"
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch candidate by email");
  }
  
  return response.json();
}

/**
 * Updates a candidate's status
 */
export async function updateCandidateStatus(
  id: number, 
  status: string
): Promise<Candidate> {
  const response = await apiRequest("PATCH", `/api/candidates/${id}`, { status });
  return response.json();
}

/**
 * Assign a candidate to a panel
 */
export async function assignCandidateToPanel(
  candidateId: number,
  panelId: number,
  roomNo: string
): Promise<Candidate> {
  const updates = {
    assignedPanel: panelId,
    roomNo,
    status: "in_process"
  };
  
  const response = await apiRequest("PATCH", `/api/candidates/${candidateId}`, updates);
  
  // Update Google Sheet with this assignment if we have an Apps Script URL
  if (GOOGLE_SCRIPT_URL) {
    try {
      const candidate = await fetchCandidateBySerialNo((await response.json()).serialNo);
      await updateCandidateInSheet(candidate);
    } catch (error) {
      console.error("Failed to update Google Sheets with panel assignment:", error);
    }
  }
  
  return response.json();
}

/**
 * Sync a candidate's information with the Google Sheet
 */
export async function updateCandidateInSheet(candidate: Candidate): Promise<boolean> {
  try {
    // First sync with our backend
    const backendResponse = await apiRequest("POST", "/api/google-sheets/control", {
      action: 'sync',
      candidates: [{
        serialNo: candidate.serialNo,
        name: candidate.name,
        email: candidate.email,
        position: candidate.position,
        status: candidate.status,
        currentRound: candidate.currentRound,
        roomNo: candidate.roomNo,
        assignedPanel: candidate.assignedPanel
      }]
    });
    
    if (!backendResponse.ok) {
      throw new Error('Failed to update candidate with backend');
    }
    
    // If we have a Google Script URL, also sync with Google Sheets
    if (GOOGLE_SCRIPT_URL) {
      const sheetsResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateCandidate',
          candidate: {
            serialNo: candidate.serialNo,
            name: candidate.name,
            email: candidate.email,
            position: candidate.position,
            status: candidate.status,
            currentRound: candidate.currentRound,
            roomNo: candidate.roomNo,
            assignedPanel: candidate.assignedPanel
          }
        }),
      });
      
      if (!sheetsResponse.ok) {
        console.warn('Backend sync successful, but Google Sheets sync failed');
        // We still return true since the backend sync was successful
        return true;
      }
      
      const data = await sheetsResponse.json();
      return data.success === true;
    }
    
    // If we don't have a Google Script URL, but backend sync was successful
    return true;
  } catch (error) {
    console.error('Error updating candidate in Google Sheet:', error);
    return false;
  }
}

/**
 * Sync all candidates with the Google Sheet
 */
export async function syncAllCandidatesWithSheet(): Promise<boolean> {
  try {
    const candidates = await fetchCandidates();
    
    // First sync with our backend
    const backendResponse = await apiRequest("POST", "/api/google-sheets/control", {
      action: 'sync',
      candidates: candidates.map(c => ({
        serialNo: c.serialNo,
        name: c.name,
        email: c.email,
        position: c.position,
        status: c.status,
        currentRound: c.currentRound,
        roomNo: c.roomNo,
        assignedPanel: c.assignedPanel
      }))
    });
    
    if (!backendResponse.ok) {
      throw new Error('Failed to sync candidates with backend');
    }
    
    // If we have a Google Script URL, also sync with Google Sheets
    if (GOOGLE_SCRIPT_URL) {
      const sheetsResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncCandidates',
          candidates: candidates.map(c => ({
            serialNo: c.serialNo,
            name: c.name,
            email: c.email,
            position: c.position,
            status: c.status,
            currentRound: c.currentRound,
            roomNo: c.roomNo,
            assignedPanel: c.assignedPanel
          }))
        }),
      });
      
      if (!sheetsResponse.ok) {
        console.warn('Backend sync successful, but Google Sheets sync failed');
        // We still return true since the backend sync was successful
        return true;
      }
      
      const data = await sheetsResponse.json();
      return data.success === true;
    }
    
    // If we don't have a Google Script URL, but backend sync was successful
    return true;
  } catch (error) {
    console.error('Error syncing candidates with Google Sheet:', error);
    return false;
  }
}
