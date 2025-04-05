import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../components/auth/AuthContext";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "panel") {
        navigate("/panel");
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary-light bg-opacity-20 p-3 mb-4">
            <svg 
              className="h-10 w-10 text-primary" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Walk-In Drive Portal</h1>
          <p className="text-neutral-600 mt-2">Sign in to manage the walk-in drive</p>
        </div>

        <LoginForm />

        <div className="text-center mt-8">
          <p className="text-sm text-neutral-500">
            Public queue access? 
            <a href="/" className="text-primary ml-1 hover:underline">
              Check the homepage
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
