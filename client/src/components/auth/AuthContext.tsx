import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  auth, 
  loginWithEmailAndPassword, 
  loginWithGoogle, 
  handleRedirectResult, 
  logoutUser,
  resetPassword
} from "@/lib/firebase";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

// Define types for our user and auth context
interface User {
  id: number;
  username: string;
  name: string;
  role: "admin" | "panel";
  email: string;
  uid?: string; // Firebase UID
  photoURL?: string; // User profile photo from Google
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  firebaseUser: FirebaseUser | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Handle Firebase auth state changes and redirect results
  useEffect(() => {
    // Handle redirect result first (if the user is coming back from a redirect)
    handleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          // User successfully signed in via redirect
          processFirebaseUser(redirectUser);
        }
      })
      .catch((error) => {
        console.error("Error handling redirect:", error);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        processFirebaseUser(fbUser);
      } else {
        // If we have a stored user but Firebase says we're logged out, clear local
        if (localStorage.getItem("user")) {
          localStorage.removeItem("user");
          setUser(null);
        }
        setLoading(false);
      }
    });

    // Check local storage as fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }

    return () => unsubscribe();
  }, []);

  // Process Firebase user into app user
  const processFirebaseUser = async (fbUser: FirebaseUser) => {
    setFirebaseUser(fbUser);

    try {
      // In a real app, this would be a call to your backend to get user claims/role
      // For now, we'll check if the email has admin or panel in it to determine role
      // This is just for demonstration purposes
      const email = fbUser.email || "";
      let role: "admin" | "panel" = "panel";
      
      if (email.includes("admin")) {
        role = "admin";
      }

      const userData: User = {
        id: parseInt(fbUser.uid.substring(0, 8), 16) || 1, // Generate an ID from Firebase UID
        username: fbUser.displayName || email.split("@")[0] || "user",
        name: fbUser.displayName || "User",
        role: role,
        email: email,
        uid: fbUser.uid,
        photoURL: fbUser.photoURL || undefined,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setLoading(false);
    } catch (error) {
      console.error("Error processing Firebase user:", error);
      setLoading(false);
    }
  };

  // Login function using Firebase email/password
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const fbUser = await loginWithEmailAndPassword(email, password);
      // The auth state change listener will handle setting the user
      toast({
        title: "Login Successful",
        description: "You have been logged in successfully."
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogleHandler = async () => {
    setLoading(true);
    try {
      // For mobile we'd use useRedirect=true, but for simplicity in this demo we'll use popup
      const fbUser = await loginWithGoogle(false);
      // The auth state change listener will handle setting the user if using redirect
      // If using popup, we get the user immediately
      if (fbUser) {
        await processFirebaseUser(fbUser);
      }
      toast({
        title: "Login Successful",
        description: "You have been logged in with Google successfully."
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login with Google",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem("user");
      navigate("/login");
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out.",
        variant: "destructive"
      });
    }
  };
  
  // Password reset function
  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      });
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithGoogle: loginWithGoogleHandler, 
      logout,
      resetPassword: handleResetPassword,
      firebaseUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
