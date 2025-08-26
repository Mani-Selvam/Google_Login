import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { CheckCircle2, Eye, EyeOff, LogIn, UserPlus, ListTodo } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = insertUserSchema.omit({ name: true });
const signupSchema = insertUserSchema;

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const onSignup = async (data: SignupFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Brand Section */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <ListTodo className="text-white text-2xl h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {activeTab === "login" 
                ? "Sign in to your account to continue" 
                : "Join us to organize your tasks efficiently"
              }
            </p>
          </div>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="Enter your email"
                                data-testid="input-login-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  data-testid="input-login-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                        data-testid="button-login-submit"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your full name"
                                data-testid="input-signup-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="Enter your email"
                                data-testid="input-signup-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a strong password"
                                  data-testid="input-signup-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                        data-testid="button-signup-submit"
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary to-blue-700 relative overflow-hidden">
        <div className="flex flex-col justify-center items-center text-white p-12 relative z-10">
          <div className="text-center max-w-md">
            <ListTodo className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Stay Organized</h2>
            <p className="text-xl mb-6 text-blue-100">
              Manage your tasks efficiently with our intuitive todo application
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Create and organize tasks</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Set deadlines and reminders</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Track your progress</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 right-1/3 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
