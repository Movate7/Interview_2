import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EyeIcon, EyeOffIcon } from "lucide-react";

// Define schema for form validation
const loginSchema = z.object({
  username: z.string().email("Please enter a valid email").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Define schema for forgot password form
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email").min(1, "Email is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function LoginForm() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler for email/password
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      await login(data.username, data.password);
      // Toast is handled in the AuthContext
    } catch (error) {
      // Error toast is handled in the AuthContext
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      await loginWithGoogle();
      // Toast is handled in the AuthContext
    } catch (error) {
      // Error toast is handled in the AuthContext
      console.error("Google login error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    }
  });
  
  // Handle forgot password submission
  const handleForgotPassword = async (data: ForgotPasswordFormValues) => {
    setIsResettingPassword(true);
    
    try {
      const success = await resetPassword(data.email);
      if (success) {
        // Show success toast
        toast({
          title: "Password Reset Email Sent",
          description: `We've sent a password reset link to ${data.email}. Please check your inbox.`,
          variant: "default",
        });
        
        // Use setTimeout to ensure we get out of the current event loop cycle
        // This avoids having the form validations run immediately after closing
        setTimeout(() => {
          setForgotPasswordOpen(false);
        }, 0);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  // Handle dialog open/close
  const handleDialogOpenChange = (open: boolean) => {
    setForgotPasswordOpen(open);
    if (!open) {
      // Reset the forgot password form when dialog is closed
      forgotPasswordForm.reset();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the Walk-In Drive Portal
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Google Login Button */}
        <Button 
          variant="outline" 
          className="w-full mb-6 flex items-center justify-center"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></span>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" className="mr-2" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"></path>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"></path>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"></path>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"></path>
              </g>
            </svg>
          )}
          {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
        </Button>
        
        <div className="flex items-center my-6">
          <Separator className="flex-grow" />
          <span className="px-4 text-neutral-500 text-sm">or</span>
          <Separator className="flex-grow" />
        </div>
        
        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                }
              }}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                  Logging in...
                </>
              ) : "Login with Email"}
            </Button>
            
            <div className="mt-2 text-center">
              <Dialog open={forgotPasswordOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="text-xs text-gray-500 hover:text-primary">
                    Forgot password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={isResettingPassword}
                          onClick={(e) => {
                            if (isResettingPassword) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {isResettingPassword ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                              Sending...
                            </>
                          ) : "Send Reset Link"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t border-neutral-200 pt-4">
        <div className="text-xs text-center text-gray-500">
          <p className="mb-1">
            For admin access, use an email containing "admin"
          </p>
          <p>
            For panel access, use any other email
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
