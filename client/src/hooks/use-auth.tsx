import React, { createContext, ReactNode, useContext } from "react";
import {
    useQuery,
    useMutation,
    UseMutationResult,
    QueryClient,
} from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { InsertUser, User as SelectUser } from "@shared/schema";

type LoginData = Pick<InsertUser, "email" | "password">;

type AuthContextType = {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
    googleLogin: (token: string, onSuccessRedirect?: () => void) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();

    const {
        data: user,
        error,
        isLoading,
    } = useQuery<SelectUser | null>({
        queryKey: ["/api/user"],
        queryFn: async () => {
            try {
                const res = await fetch("/api/user", {
                    credentials: "include",
                });

                if (res.status === 401) {
                    return null;
                }

                if (!res.ok) {
                    throw new Error(`${res.status}: ${res.statusText}`);
                }

                const data = await res.json();
                console.log(
                    "Auth check result:",
                    data.user?.id,
                    data.user?.email
                );
                return data.user;
            } catch (error) {
                console.error("Auth check failed:", error);
                return null;
            }
        },
        retry: false,
        refetchOnWindowFocus: false,
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginData) => {
            const res = await apiRequest("POST", "/api/login", credentials);
            const data = await res.json();
            console.log(
                "Login successful for user:",
                data.user?.id,
                data.user?.email
            );
            return data.user;
        },
        onSuccess: (userData: SelectUser) => {
            queryClient.setQueryData(["/api/user"], userData);
            queryClient.invalidateQueries({ queryKey: ["/api/todos"] }); // Clear old todos
            setLocation("/");
        },
        onError: (error: Error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (credentials: InsertUser) => {
            const res = await apiRequest("POST", "/api/register", credentials);
            const data = await res.json();
            console.log(
                "Registration successful for user:",
                data.user?.id,
                data.user?.email
            );
            return data.user;
        },
        onSuccess: (userData: SelectUser) => {
            queryClient.setQueryData(["/api/user"], userData);
            queryClient.invalidateQueries({ queryKey: ["/api/todos"] }); // Clear old todos
            setLocation("/");
        },
        onError: (error: Error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/logout");
        },
        onSuccess: () => {
            console.log("Logout successful, clearing all data");
            queryClient.clear(); // Clear ALL cached data
            queryClient.setQueryData(["/api/user"], null);
            setLocation("/auth");
        },
        onError: (error: Error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const googleLoginMutation = useMutation({
        mutationFn: async (token: string) => {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ token }),
            });
            if (!res.ok) throw new Error("Google login failed");
            const data = await res.json();
            console.log(
                "Google login successful for user:",
                data.user?.id,
                data.user?.email
            );
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["/api/user"], data.user);
            queryClient.invalidateQueries({ queryKey: ["/api/todos"] }); // Clear old todos
            setLocation("/");
        },
        onError: (error: Error) => {
            toast({
                title: "Google Sign-In failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const googleLogin = (token: string, onSuccessRedirect?: () => void) => {
        googleLoginMutation.mutate(token, {
            onSuccess: () => {
                if (onSuccessRedirect) {
                    onSuccessRedirect();
                } else {
                    setLocation("/");
                }
            },
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
                googleLogin,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
