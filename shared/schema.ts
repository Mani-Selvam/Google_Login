import { sql } from "drizzle-orm";
import {
    pgTable,
    text,
    varchar,
    timestamp,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    googleId: text("google_id"), // remove .nullable(), no nullable() method exists
    provider: text("provider"), // remove .nullable()
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const todos = pgTable("todos", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email"), // just omit .notNull() to make nullable
    date: text("date").notNull(),
    time: text("time").notNull(),
    completed: boolean("completed").default(false).notNull(),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
    user: one(users, {
        fields: [todos.userId],
        references: [users.id],
    }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
    name: true,
    email: true,
    password: true,
});

export const insertTodoSchema = createInsertSchema(todos).pick({
    name: true,
    email: true, // no .optional(); zod optional added in separate step if needed
    date: true,
    time: true,
});

export const insertGoogleUserSchema = createInsertSchema(users)
    .pick({
        email: true,
        googleId: true,
        provider: true,
    })
    .extend({
        name: z.string().optional(),
        password: z.string().optional(),
    })
    .strict();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todos.$inferSelect;
export type InsertGoogleUser = z.infer<typeof insertGoogleUserSchema>;
