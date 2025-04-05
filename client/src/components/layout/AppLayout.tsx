import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../auth/AuthContext";
import Navigation from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "panel" | null;
}

export default function AppLayout({ children, requiredRole = null }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If not loading and no user, redirect to login page
    if (!loading && requiredRole !== null && !user) {
      navigate("/login");
    }

    // If user exists but doesn't have the required role
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "panel") {
        navigate("/panel");
      } else {
        navigate("/login");
      }
    }
  }, [loading, user, requiredRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a role is required and we have no user, don't render the children yet
  if (requiredRole !== null && !user) {
    return null;
  }

  // If a role is required and the user doesn't have it, don't render the children
  if (requiredRole !== null && user && user.role !== requiredRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navigation />
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
