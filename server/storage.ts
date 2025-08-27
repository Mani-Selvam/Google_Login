import {
    users,
    todos,
    type User,
    type InsertUser,
    type Todo,
    type InsertTodo,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getUserByGoogleId(googleId: string): Promise<User | undefined>;
    createUser(user: InsertUser & { googleId?: string }): Promise<User>;
    createOrUpdateGoogleUser(user: {
        email: string;
        name?: string;
        googleId: string;
        provider?: "google";
    }): Promise<User>;
    getUserTodos(userId: string): Promise<Todo[]>;
    createTodo(todo: InsertTodo & { userId: string }): Promise<Todo>;
    updateTodo(
        id: string,
        userId: string,
        updates: Partial<Todo>
    ): Promise<Todo | undefined>;
    deleteTodo(id: string, userId: string): Promise<boolean>;
    sessionStore: any;
}

export class DatabaseStorage implements IStorage {
    sessionStore: any;

    constructor() {
        this.sessionStore = new PostgresSessionStore({
            pool,
            createTableIfMissing: true,
        });
    }

    async getUser(id: string): Promise<User | undefined> {
        if (!id) {
            console.warn("getUser called with empty ID");
            return undefined;
        }

        console.log(`Database: Getting user with ID: ${id}`);
        const [user] = await db.select().from(users).where(eq(users.id, id));
        console.log(
            `Database: Found user:`,
            user ? `${user.name} (${user.email})` : "not found"
        );
        return user || undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        if (!email) {
            console.warn("getUserByEmail called with empty email");
            return undefined;
        }

        console.log(`Database: Getting user by email: ${email}`);
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        console.log(
            `Database: Found user by email:`,
            user ? `${user.name} (ID: ${user.id})` : "not found"
        );
        return user || undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        // In this app, username is email
        return this.getUserByEmail(username);
    }

    async createUser(user: InsertUser & { googleId?: string }): Promise<User> {
        console.log(`Database: Creating new user: ${user.email}`);
        const [newUser] = await db.insert(users).values(user).returning();
        console.log(`Database: Created user with ID: ${newUser.id}`);
        return newUser;
    }

    async getUserByGoogleId(googleId: string): Promise<User | undefined> {
        if (!googleId) {
            console.warn("getUserByGoogleId called with empty googleId");
            return undefined;
        }

        console.log(`Database: Getting user by Google ID: ${googleId}`);
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, googleId));
        console.log(
            `Database: Found user by Google ID:`,
            user ? `${user.name} (${user.email})` : "not found"
        );
        return user || undefined;
    }

    async createOrUpdateGoogleUser(user: {
        email: string;
        name?: string;
        googleId: string;
        provider?: "google";
    }): Promise<User> {
        console.log(`Database: Creating/updating Google user: ${user.email}`);

        const existingUser = await this.getUserByEmail(user.email);

        if (!existingUser) {
            console.log(`Database: Creating new Google user`);
            const [newUser] = await db
                .insert(users)
                .values({
                    email: user.email,
                    name: user.name ?? "Google User",
                    googleId: user.googleId,
                    provider: user.provider ?? "google",
                    password: "", // blank password for Google users
                })
                .returning();
            console.log(`Database: Created Google user with ID: ${newUser.id}`);
            return newUser;
        }

        console.log(
            `Database: Updating existing user ${existingUser.id} with Google credentials`
        );
        const [updatedUser] = await db
            .update(users)
            .set({
                googleId: user.googleId,
                provider: "google",
            })
            .where(eq(users.email, user.email))
            .returning();

        console.log(
            `Database: Updated user ${updatedUser.id} with Google credentials`
        );
        return updatedUser;
    }

    async getUserTodos(userId: string): Promise<Todo[]> {
        if (!userId) {
            console.warn("getUserTodos called with empty userId");
            return [];
        }

        console.log(`Database: Getting todos for user ID: ${userId}`);
        const userTodos = await db
            .select()
            .from(todos)
            .where(eq(todos.userId, userId));
        console.log(
            `Database: Found ${userTodos.length} todos for user ${userId}`
        );

        // Additional security check - log todo details for debugging
        if (userTodos.length > 0) {
            console.log(
                `Database: Todo details for user ${userId}:`,
                userTodos.map(
                    (t) => `${t.name} (ID: ${t.id}, UserID: ${t.userId})`
                )
            );
        }

        return userTodos;
    }

    async createTodo(todo: InsertTodo & { userId: string }): Promise<Todo> {
        if (!todo.userId) {
            throw new Error("Cannot create todo without userId");
        }

        console.log(
            `Database: Creating todo for user ${todo.userId}: ${todo.name}`
        );
        const [newTodo] = await db.insert(todos).values(todo).returning();
        console.log(
            `Database: Created todo ${newTodo.id} for user ${newTodo.userId}`
        );
        return newTodo;
    }

    async updateTodo(
        id: string,
        userId: string,
        updates: Partial<Todo>
    ): Promise<Todo | undefined> {
        if (!id || !userId) {
            console.warn("updateTodo called with empty id or userId");
            return undefined;
        }

        console.log(`Database: User ${userId} updating todo ${id}`);

        // First, check if the todo exists and belongs to the user
        const [existingTodo] = await db
            .select()
            .from(todos)
            .where(and(eq(todos.id, id), eq(todos.userId, userId)));

        if (!existingTodo) {
            console.warn(
                `Database: Todo ${id} not found or does not belong to user ${userId}`
            );
            return undefined;
        }

        const [updatedTodo] = await db
            .update(todos)
            .set(updates)
            .where(and(eq(todos.id, id), eq(todos.userId, userId)))
            .returning();

        console.log(`Database: Updated todo ${id} for user ${userId}`);
        return updatedTodo || undefined;
    }

    async deleteTodo(id: string, userId: string): Promise<boolean> {
        if (!id || !userId) {
            console.warn("deleteTodo called with empty id or userId");
            return false;
        }

        console.log(`Database: User ${userId} deleting todo ${id}`);

        // First, check if the todo exists and belongs to the user
        const [existingTodo] = await db
            .select()
            .from(todos)
            .where(and(eq(todos.id, id), eq(todos.userId, userId)));

        if (!existingTodo) {
            console.warn(
                `Database: Todo ${id} not found or does not belong to user ${userId}`
            );
            return false;
        }

        const result = await db
            .delete(todos)
            .where(and(eq(todos.id, id), eq(todos.userId, userId)));

        const deleted = (result.rowCount ?? 0) > 0;
        console.log(
            `Database: ${
                deleted ? "Successfully deleted" : "Failed to delete"
            } todo ${id} for user ${userId}`
        );
        return deleted;
    }
}

export const storage = new DatabaseStorage();
