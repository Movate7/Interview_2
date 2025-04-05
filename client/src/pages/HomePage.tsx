import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createCandidateManually } from "@/lib/googleSheets";
import { Link } from "wouter";

// Form validation schema
const trackCandidateSchema = z.object({
  trackMethod: z.enum(["email", "serial"]).default("email"),
  email: z.string().optional(),
  serialNo: z.string().optional(),
}).refine(data => {
  if (data.trackMethod === "email") {
    return !!data.email;
  } else {
    return !!data.serialNo;
  }
}, {
  message: "Please enter either an email address or a serial number",
  path: ["email"],
});

// Manual registration schema
const registerCandidateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  position: z.string().min(2, "Position is required")
});

type TrackFormValues = z.infer<typeof trackCandidateSchema>;
type RegisterFormValues = z.infer<typeof registerCandidateSchema>;

export default function HomePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"track" | "register">("track");

  // Track candidate form
  const trackForm = useForm<TrackFormValues>({
    resolver: zodResolver(trackCandidateSchema),
    defaultValues: {
      trackMethod: "email",
      email: "",
      serialNo: ""
    }
  });

  // Register candidate form (for testing without Google Forms)
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerCandidateSchema),
    defaultValues: {
      name: "",
      email: "",
      position: ""
    }
  });

  // Mutation for manual candidate registration
  const registerMutation = useMutation({
    mutationFn: createCandidateManually,
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: `You've been registered with serial number: ${data.serialNo}`,
      });
      registerForm.reset();
      
      // Navigate to the queue page using email (more secure)
      setTimeout(() => {
        navigate(`/queue-email/${encodeURIComponent(data.email)}`);
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description: "There was an error registering you. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle track form submission
  const onTrackSubmit = (data: TrackFormValues) => {
    if (data.trackMethod === "email" && data.email) {
      navigate(`/queue-email/${encodeURIComponent(data.email)}`);
    } else if (data.trackMethod === "serial" && data.serialNo) {
      navigate(`/queue/${encodeURIComponent(data.serialNo)}`);
    } else {
      toast({
        title: "Error",
        description: "Please enter either an email address or a serial number",
        variant: "destructive",
      });
    }
  };

  // Handle register form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Walk-In Drive Management Portal</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Register for interviews, track your position in real-time, and get instant feedback
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Welcome to the Portal</CardTitle>
              <CardDescription>
                Track your position or register for the walk-in drive
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Tabs */}
              <div className="flex border-b border-neutral-200 mb-6">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "track"
                      ? "text-primary border-b-2 border-primary"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  onClick={() => setActiveTab("track")}
                >
                  Track Your Position
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "register"
                      ? "text-primary border-b-2 border-primary"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  onClick={() => setActiveTab("register")}
                >
                  Register (Demo)
                </button>
              </div>

              {/* Track Form */}
              {activeTab === "track" && (
                <Form {...trackForm}>
                  <form onSubmit={trackForm.handleSubmit(onTrackSubmit)} className="space-y-4">
                    <FormField
                      control={trackForm.control}
                      name="trackMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Track Using</FormLabel>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                className="form-radio h-4 w-4 text-primary"
                                checked={field.value === "email"}
                                onChange={() => field.onChange("email")}
                              />
                              <span>Email</span>
                            </label>
                            
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                className="form-radio h-4 w-4 text-primary"
                                checked={field.value === "serial"}
                                onChange={() => field.onChange("serial")}
                              />
                              <span>Serial Number</span>
                            </label>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {trackForm.watch("trackMethod") === "email" ? (
                      <FormField
                        control={trackForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email address" 
                                type="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={trackForm.control}
                        name="serialNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Serial Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your serial number (e.g. WD-001)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <Button type="submit" className="w-full">
                      Track Position
                    </Button>
                  </form>
                </Form>
              )}

              {/* Register Form */}
              {activeTab === "register" && (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Frontend Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                    
                    <p className="text-xs text-neutral-500 text-center mt-2">
                      This is a demo registration form. In production, this would be replaced by Google Forms.
                    </p>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between border-t border-neutral-200 pt-4">
              <p className="text-sm text-neutral-500">
                Admin or panel member?
              </p>
              <Link 
                to="/login"
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                Login here
              </Link>
            </CardFooter>
          </Card>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="rounded-full h-12 w-12 bg-blue-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Real-time Updates</h3>
              <p className="text-neutral-600 text-sm">
                Track your queue position in real-time and receive instant updates about your interview status.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Streamlined Process</h3>
              <p className="text-neutral-600 text-sm">
                Enjoy a seamless interview experience with efficient queue management and minimal waiting time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 text-neutral-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2023 Walk-In Drive Management Portal</p>
          <p className="text-sm">A zero-cost solution for managing walk-in interviews</p>
        </div>
      </footer>
    </div>
  );
}
