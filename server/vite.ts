import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
}

// ✅ Development mode with Vite middleware + HMR
export async function setupVite(app: Express, server?: Server) {
    const serverOptions = {
        middlewareMode: true,
        hmr: server ? { server } : false,
        allowedHosts: true as const,
    };

    const vite = await createViteServer({
        ...viteConfig,
        configFile: false,
        customLogger: {
            ...viteLogger,
            error: (msg, options) => {
                viteLogger.error(msg, options);
                if (process.env.NODE_ENV === "production") {
                    process.exit(1);
                }
            },
        },
        server: serverOptions,
        appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;

        try {
            // Point directly to client/index.html in dev
            const clientTemplate = path.resolve(
                process.cwd(),
                "client",
                "index.html"
            );

            if (!fs.existsSync(clientTemplate)) {
                throw new Error(`Template file not found: ${clientTemplate}`);
            }

            let template = await fs.promises.readFile(clientTemplate, "utf-8");

            const page = await vite.transformIndexHtml(url, template);

            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (e) {
            console.error("Error serving HTML:", e);
            if (vite.ssrFixStacktrace) {
                vite.ssrFixStacktrace(e as Error);
            }
            next(e);
        }
    });
}

// ✅ Production mode with built static files (dist/public)
export function serveStatic(app: Express) {
    const publicPath = path.resolve(process.cwd(), "dist", "public");

    if (!fs.existsSync(publicPath)) {
        throw new Error(
            `Build files not found at ${publicPath}. Did you run "npm run build"?`
        );
    }

    // Serve static assets
    app.use(express.static(publicPath));

    // React Router / SPA fallback
    app.use("*", (_req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
    });
}
