import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  onSnapshot,
  query, 
  where 
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const loginWithGoogle = async (useRedirect = false) => {
  try {
    if (useRedirect) {
      // Redirect flow (better for mobile)
      await signInWithRedirect(auth, googleProvider);
      return null; // User will be redirected, so no return value
    } else {
      // Popup flow (better for desktop)
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User is signed in
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// Set up persistence and additional settings
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configuration management functions
interface SheetConfig {
  id: string;
  name: string;
  url: string;
  description: string;
  lastUpdated?: number;
}

interface AppConfig {
  sheetsConfig: SheetConfig[];
  webhookUrl?: string;
  autoSyncEnabled?: boolean;
  lastSyncTime?: number;
}

// Get configuration from Firestore
export const getAppConfig = async (): Promise<AppConfig> => {
  try {
    const configRef = doc(db, "configuration", "appConfig");
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data() as AppConfig;
    } else {
      // If no config exists yet, create a default one
      const defaultConfig: AppConfig = {
        sheetsConfig: [
          {
            id: "candidate-form",
            name: "Candidate Form Responses",
            url: "",
            description: "Contains responses from the candidate registration form"
          },
          {
            id: "interview-feedback",
            name: "Interview Feedback",
            url: "",
            description: "Stores interview feedback and application configuration settings"
          }
        ],
        webhookUrl: `${window.location.origin}/api/google-sheets/webhook`,
        autoSyncEnabled: false,
        lastSyncTime: Date.now()
      };
      
      // Save default config
      await setDoc(configRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("Error getting app configuration:", error);
    // Fallback to localStorage if Firestore fails
    return {
      sheetsConfig: [
        {
          id: "candidate-form",
          name: "Candidate Form Responses",
          url: localStorage.getItem("sheet_candidate-form") || "",
          description: "Contains responses from the candidate registration form"
        },
        {
          id: "interview-feedback",
          name: "Interview Feedback",
          url: localStorage.getItem("sheet_interview-feedback") || "",
          description: "Stores interview feedback and application configuration settings"
        }
      ],
      webhookUrl: `${window.location.origin}/api/google-sheets/webhook`,
      autoSyncEnabled: false
    };
  }
};

// Update configuration in Firestore
export const updateAppConfig = async (config: Partial<AppConfig>): Promise<boolean> => {
  try {
    const configRef = doc(db, "configuration", "appConfig");
    
    // First, get the current config
    const currentConfigSnap = await getDoc(configRef);
    let currentConfig: AppConfig;
    
    if (currentConfigSnap.exists()) {
      currentConfig = currentConfigSnap.data() as AppConfig;
    } else {
      // If no config exists, start with a default and then apply updates
      currentConfig = await getAppConfig();
    }
    
    // Merge current config with updates
    const updatedConfig = {
      ...currentConfig,
      ...config,
      // Special handling for nested sheetsConfig
      sheetsConfig: config.sheetsConfig || currentConfig.sheetsConfig,
      // Always update the lastSyncTime when config is changed
      lastSyncTime: Date.now()
    };
    
    // Update in Firestore
    await setDoc(configRef, updatedConfig);
    
    // For backwards compatibility, also update localStorage
    if (config.sheetsConfig) {
      config.sheetsConfig.forEach(sheet => {
        localStorage.setItem(`sheet_${sheet.id}`, sheet.url);
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating app configuration:", error);
    
    // Fallback to localStorage if Firestore fails
    if (config.sheetsConfig) {
      config.sheetsConfig.forEach(sheet => {
        localStorage.setItem(`sheet_${sheet.id}`, sheet.url);
      });
    }
    
    return false;
  }
};

// Subscribe to configuration changes
export const subscribeToConfigChanges = (callback: (config: AppConfig) => void): () => void => {
  const configRef = doc(db, "configuration", "appConfig");
  
  // Set up listener
  const unsubscribe = onSnapshot(configRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as AppConfig);
    }
  }, (error) => {
    console.error("Error subscribing to configuration changes:", error);
  });
  
  // Return unsubscribe function
  return unsubscribe;
};

export { auth, db };
export default app;
