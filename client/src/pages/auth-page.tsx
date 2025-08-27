import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Label } from "@/components/ui/label";

import {
    CheckCircle2,
    Eye,
    EyeOff,
    LogIn,
    UserPlus,
    ListTodo,
    Calendar, // Add this import
    Clock, // Add this import
    Mail, // Add this import
} from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = insertUserSchema.omit({ name: true });
const signupSchema = insertUserSchema;

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function AuthPage() {
    const {
        user,
        loginMutation,
        registerMutation,
        googleLogin,
        logoutMutation,
    } = useAuth();
    const [location, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user && !logoutMutation.isPending) {
            setLocation("/");
        }
    }, [user, setLocation, logoutMutation.isPending]);

    useEffect(() => {
        if (user && location === "/auth") {
            logoutMutation.mutate();
        }
    }, []);

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const onLogin = async (data: LoginFormData) => {
        try {
            await loginMutation.mutateAsync(data);
            toast({
                title: "Success",
                description: "Logged in successfully!",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Invalid credentials. Please try again.",
                variant: "destructive",
            });
        }
    };

    const onSignup = async (data: SignupFormData) => {
        try {
            await registerMutation.mutateAsync(data);
            toast({
                title: "Success",
                description: "Account created successfully!",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create account. Please try again.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        const renderGoogleButton = (id: string) => {
            const container = document.getElementById(id);
            if (window.google && container && !user) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: (response) => {
                        if (response.credential) {
                            googleLogin(response.credential, () => {
                                toast({
                                    title: "Success",
                                    description:
                                        "Logged in with Google successfully!",
                                });
                                setLocation("/");
                            });
                        }
                    },
                });
                window.google.accounts.id.renderButton(container, {
                    theme: "outline",
                    size: "large",
                    width: "100%",
                });
            }
        };

        if (!user) {
            renderGoogleButton("googleSignInLogin");
            renderGoogleButton("googleSignInSignup");

            if (window.google) {
                window.google.accounts.id.prompt();
            }
        }
    }, [googleLogin, setLocation, user, toast]);

    if (logoutMutation.isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <ListTodo className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Signing out...</p>
                </div>
            </div>
        );
    }

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
                            {activeTab === "login"
                                ? "Welcome Back"
                                : "Create Account"}
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            {activeTab === "login"
                                ? "Sign in to your account to continue"
                                : "Join us to organize your tasks efficiently"}
                        </p>
                    </div>

                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8">
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger
                                        value="login"
                                        className="flex items-center gap-2">
                                        <LogIn className="h-4 w-4" />
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="signup"
                                        className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Sign Up
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="login">
                                    <Form {...loginForm}>
                                        <form
                                            onSubmit={loginForm.handleSubmit(
                                                onLogin
                                            )}
                                            className="space-y-4">
                                            <FormField
                                                control={loginForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Email Address
                                                        </FormLabel>
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
                                                        <FormLabel>
                                                            Password
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    {...field}
                                                                    type={
                                                                        showPassword
                                                                            ? "text"
                                                                            : "password"
                                                                    }
                                                                    placeholder="Enter your password"
                                                                    data-testid="input-login-password"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            !showPassword
                                                                        )
                                                                    }
                                                                    data-testid="button-toggle-password">
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
                                                disabled={
                                                    loginMutation.isPending
                                                }
                                                data-testid="button-login-submit">
                                                {loginMutation.isPending
                                                    ? "Signing in..."
                                                    : "Sign In"}
                                            </Button>

                                            <div className="flex items-center my-4">
                                                <span className="flex-grow border-t border-gray-300"></span>
                                                <span className="mx-2 text-gray-500">
                                                    OR
                                                </span>
                                                <span className="flex-grow border-t border-gray-300"></span>
                                            </div>

                                            <div
                                                id="googleSignInLogin"
                                                className="w-full flex justify-center"></div>
                                        </form>
                                    </Form>
                                </TabsContent>

                                <TabsContent value="signup">
                                    <Form {...signupForm}>
                                        <form
                                            onSubmit={signupForm.handleSubmit(
                                                onSignup
                                            )}
                                            className="space-y-4">
                                            <FormField
                                                control={signupForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Full Name
                                                        </FormLabel>
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
                                                        <FormLabel>
                                                            Email Address
                                                        </FormLabel>
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
                                                        <FormLabel>
                                                            Password
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    {...field}
                                                                    type={
                                                                        showPassword
                                                                            ? "text"
                                                                            : "password"
                                                                    }
                                                                    placeholder="Create a password"
                                                                    data-testid="input-signup-password"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            !showPassword
                                                                        )
                                                                    }
                                                                    data-testid="button-toggle-password-signup">
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
                                                disabled={
                                                    registerMutation.isPending
                                                }
                                                data-testid="button-signup-submit">
                                                {registerMutation.isPending
                                                    ? "Creating account..."
                                                    : "Create Account"}
                                            </Button>

                                            <div className="flex items-center my-4">
                                                <span className="flex-grow border-t border-gray-300"></span>
                                                <span className="mx-2 text-gray-500">
                                                    OR
                                                </span>
                                                <span className="flex-grow border-t border-gray-300"></span>
                                            </div>

                                            <div
                                                id="googleSignInSignup"
                                                className="w-full flex justify-center"></div>
                                        </form>
                                    </Form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Side - Feature Showcase */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <h3 className="font-medium text-gray-900">
                                Task Management
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Organize your daily tasks efficiently
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <h3 className="font-medium text-gray-900">
                                Time Tracking
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Schedule and track your activities
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Mail className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                            <h3 className="font-medium text-gray-900">
                                Email Integration
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Connect tasks with email contacts
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <h3 className="font-medium text-gray-900">
                                Reminders
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Never miss important deadlines
                            </p>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Simplify Your Workflow
                    </h2>
                    <p className="text-gray-600">
                        Join thousands of users who have streamlined their task
                        management and boosted their productivity with our
                        intuitive platform.
                    </p>
                </div>
            </div>
        </div>
    );
}
