import { useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import PanelDashboard from "@/components/panel/PanelDashboard";
import { useAuth } from "@/components/auth/AuthContext";

export default function PanelPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not a panel member
  useEffect(() => {
    if (user && user.role !== "panel") {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <AppLayout requiredRole="panel">
      <PanelDashboard />
    </AppLayout>
  );
}
