import express from "express";
import session from "express-session";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as dotenv from "dotenv";
import { storage } from "./storage";
import { setupVite, serveStatic } from "./vite";
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        credentials: true,
    })
);

// Session middleware (only set up once)
app.use(
    session({
        secret:
            process.env.SESSION_SECRET || "change_this_secret_in_production",
        resave: false,
        saveUninitialized: false,
        store: storage.sessionStore,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

(async () => {
    const httpServer = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: any, res: any, _next: any) => {
        console.error("Server error:", err);
        res.status(err.status || 500).json({
            message: err.message || "Internal server error",
        });
    });

    if (app.get("env") === "development") {
        await setupVite(app, httpServer);
    } else {
        serveStatic(app);
    }

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
})();
