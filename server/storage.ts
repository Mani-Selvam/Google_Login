import { users, todos, type User, type InsertUser, type Todo, type InsertTodo } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserTodos(userId: string): Promise<Todo[]>;
  createTodo(todo: InsertTodo & { userId: string }): Promise<Todo>;
  updateTodo(id: string, userId: string, updates: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(id: string, userId: string): Promise<boolean>;
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // In this app, username is actually email
    return this.getUserByEmail(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserTodos(userId: string): Promise<Todo[]> {
    return await db.select().from(todos).where(eq(todos.userId, userId));
  }

  async createTodo(todo: InsertTodo & { userId: string }): Promise<Todo> {
    const [newTodo] = await db
      .insert(todos)
      .values(todo)
      .returning();
    return newTodo;
  }

  async updateTodo(id: string, userId: string, updates: Partial<Todo>): Promise<Todo | undefined> {
    const [updatedTodo] = await db
      .update(todos)
      .set(updates)
      .where(eq(todos.id, id) && eq(todos.userId, userId))
      .returning();
    return updatedTodo || undefined;
  }

  async deleteTodo(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(todos)
      .where(eq(todos.id, id) && eq(todos.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
