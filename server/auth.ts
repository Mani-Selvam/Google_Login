import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { OAuth2Client } from "google-auth-library";

declare global {
    namespace Express {
        interface User extends SelectUser {}
    }
}

const scryptAsync = promisify(scrypt);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
    supplied: string,
    stored: string
): Promise<boolean> {
    if (!stored || !stored.includes(".")) {
        throw new Error("Stored password missing salt");
    }
    const [hashed, salt] = stored.split(".");
    if (!salt) throw new Error("Salt missing from stored password hash");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
    // Initialize passport middleware (session already set up in index.ts)
    app.use(passport.initialize());
    app.use(passport.session());

    // Local username/password strategy
    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            async (email, password, done) => {
                try {
                    const user = await storage.getUserByEmail(email);
                    if (!user) return done(null, false);
                    const valid = await comparePasswords(
                        password,
                        user.password
                    );
                    if (!valid) return done(null, false);
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        console.log(`Passport: Serializing user ${user.id}`);
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            console.log(`Passport: Deserializing user ${id}`);
            const user = await storage.getUser(id);

            if (!user) {
                console.warn(
                    `Passport: User ${id} not found in database - session is stale`
                );
                // Clear the session instead of throwing error
                return done(null, false);
            }

            console.log(
                `Passport: Successfully deserialized user ${user.id} (${user.email})`
            );
            done(null, user);
        } catch (err) {
            console.error(`Passport: Error deserializing user ${id}:`, err);
            done(null, false); // Clear session instead of error
        }
    });

    // Google OAuth login route
    app.post("/api/auth/google", async (req, res, next) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: "Token is required" });
            }

            console.log("Processing Google login");
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload?.email || !payload?.sub) {
                return res.status(400).json({ error: "Invalid token" });
            }

            const user = await storage.createOrUpdateGoogleUser({
                email: payload.email,
                name: payload.name || "Google User",
                googleId: payload.sub,
            });

            req.login(user, (err) => {
                if (err) return next(err);
                console.log(`Google login successful for user ${user.id}`);
                res.status(200).json({ user });
            });
        } catch (err) {
            console.error("Google auth error:", err);
            res.status(500).json({ error: "Google authentication failed" });
        }
    });

    // Registration route
    app.post("/api/register", async (req, res, next) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res
                    .status(400)
                    .json({ error: "Name, email, and password are required" });
            }

            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }

            const user = await storage.createUser({
                name,
                email,
                password: await hashPassword(password),
            });

            req.login(user, (err) => {
                if (err) return next(err);
                console.log(`Registration successful for user ${user.id}`);
                res.status(201).json({ user });
            });
        } catch (err) {
            console.error("Registration error:", err);
            next(err);
        }
    });

    // Local login route
    app.post("/api/login", (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user)
                return res.status(401).json({ error: "Invalid credentials" });

            req.login(user, (err) => {
                if (err) return next(err);
                console.log(`Login successful for user ${user.id}`);
                res.status(200).json({ user });
            });
        })(req, res, next);
    });

    // Logout route
    app.post("/api/logout", (req, res, next) => {
        const userId = req.user?.id;
        console.log(`Logout requested for user ${userId}`);

        req.logout((err) => {
            if (err) return next(err);

            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session:", err);
                    return next(err);
                }

                res.clearCookie("connect.sid");
                console.log(`Logout successful for user ${userId}`);
                res.status(200).json({ message: "Logged out successfully" });
            });
        });
    });

    // Get current logged-in user
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) {
            console.log("User check: Not authenticated");
            return res.status(401).json({ error: "Not authenticated" });
        }

        console.log(`User check: Authenticated user ${req.user.id}`);
        res.json({ user: req.user });
    });

    // Middleware to handle stale sessions
    app.use((req, res, next) => {
        // If the session exists but user deserialization failed, clear it
        if (req.session && req.session.passport && !req.user) {
            console.log("Clearing stale session");
            req.session.destroy((err) => {
                if (err) console.error("Error clearing stale session:", err);
            });
        }
        next();
    });
}
