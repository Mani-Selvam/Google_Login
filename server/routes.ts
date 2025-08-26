import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTodoSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Todo routes
  app.get("/api/todos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const todos = await storage.getUserTodos(req.user.id);
      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ message: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertTodoSchema.parse(req.body);
      const todo = await storage.createTodo({
        ...validatedData,
        userId: req.user.id,
      });
      res.status(201).json(todo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid todo data", errors: error.errors });
      }
      console.error("Error creating todo:", error);
      res.status(500).json({ message: "Failed to create todo" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedTodo = await storage.updateTodo(id, req.user.id, updates);
      if (!updatedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }
      
      res.json(updatedTodo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ message: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { id } = req.params;
      const deleted = await storage.deleteTodo(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Todo not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ message: "Failed to delete todo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
