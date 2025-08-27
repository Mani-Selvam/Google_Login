import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTodoSchema } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
    _userId?: string;
}

export function registerRoutes(app: Express): Server {
    // 🔐 Auth routes (login, register, logout, user, Google Sign-In)
    setupAuth(app);

    // 🔑 Helper middleware to enforce authentication and get user ID
    function requireUser(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        // Only use req.user.id from passport authentication
        const userId = req.user?.id;

        if (!userId || !req.isAuthenticated()) {
            return res
                .status(401)
                .json({ message: "Unauthorized - Please log in" });
        }

        // Ensure userId is a string
        req._userId = String(userId);
        next();
    }

    // ✅ Get all todos for authenticated user ONLY
    app.get(
        "https://google-login-todo-app.onrender.com/api/todos",
        requireUser,
        async (req: AuthenticatedRequest, res: Response) => {
            try {
                if (!req._userId) {
                    return res
                        .status(401)
                        .json({ message: "User ID not found" });
                }

                console.log(`Fetching todos for user ID: ${req._userId}`); // Debug log
                const todos = await storage.getUserTodos(req._userId);
                console.log(
                    `Found ${todos.length} todos for user ${req._userId}`
                ); // Debug log

                res.json(todos);
            } catch (error) {
                console.error("Error fetching todos:", error);
                res.status(500).json({ message: "Failed to fetch todos" });
            }
        }
    );

    // ✅ Create new todo for authenticated user
    app.post(
        "https://google-login-todo-app.onrender.com/api/todos",
        requireUser,
        async (req: AuthenticatedRequest, res: Response) => {
            try {
                if (!req._userId) {
                    return res
                        .status(401)
                        .json({ message: "User ID not found" });
                }

                const validatedData = insertTodoSchema.parse(req.body);
                const todo = await storage.createTodo({
                    ...validatedData,
                    userId: req._userId, // Ensure todo is created for the correct user
                });

                console.log(`Created todo for user ${req._userId}:`, todo); // Debug log
                res.status(201).json(todo);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return res.status(400).json({
                        message: "Invalid todo data",
                        errors: error.errors,
                    });
                }
                console.error("Error creating todo:", error);
                res.status(500).json({ message: "Failed to create todo" });
            }
        }
    );

    // ✅ Update existing todo (only if owned by user)
    app.patch(
        "https://google-login-todo-app.onrender.com/api/todos/:id",
        requireUser,
        async (req: AuthenticatedRequest, res: Response) => {
            try {
                if (!req._userId) {
                    return res
                        .status(401)
                        .json({ message: "User ID not found" });
                }

                const { id } = req.params;
                const updates = req.body;

                console.log(`User ${req._userId} updating todo ${id}`); // Debug log

                const updatedTodo = await storage.updateTodo(
                    id,
                    req._userId, // This ensures only the owner can update
                    updates
                );

                if (!updatedTodo) {
                    return res
                        .status(404)
                        .json({ message: "Todo not found or access denied" });
                }

                res.json(updatedTodo);
            } catch (error) {
                console.error("Error updating todo:", error);
                res.status(500).json({ message: "Failed to update todo" });
            }
        }
    );

    // ✅ Delete todo (only if owned by user)
    app.delete(
        "https://google-login-todo-app.onrender.com/api/todos/:id",
        requireUser,
        async (req: AuthenticatedRequest, res: Response) => {
            try {
                if (!req._userId) {
                    return res
                        .status(401)
                        .json({ message: "User ID not found" });
                }

                const { id } = req.params;

                console.log(`User ${req._userId} deleting todo ${id}`); // Debug log

                const deleted = await storage.deleteTodo(id, req._userId); // This ensures only the owner can delete

                if (!deleted) {
                    return res
                        .status(404)
                        .json({ message: "Todo not found or access denied" });
                }

                res.status(204).send();
            } catch (error) {
                console.error("Error deleting todo:", error);
                res.status(500).json({ message: "Failed to delete todo" });
            }
        }
    );

    // 🖥️ Start HTTP server
    const httpServer = createServer(app);
    return httpServer;
}
