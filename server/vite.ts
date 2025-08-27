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
            const clientTemplate = path.resolve(
                process.cwd(),
                "client",
                "index.html"
            );

            if (!fs.existsSync(clientTemplate)) {
                throw new Error(`Template file not found: ${clientTemplate}`);
            }

            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = template.replace(
                `src="/src/main.tsx"`,
                `src="/src/main.tsx?v=${nanoid()}"`
            );
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

export function serveStatic(app: Express) {
    // Check multiple possible build directories
    const possiblePaths = [
        path.resolve(process.cwd(), "dist", "client"), // Most likely for Vite builds
        path.resolve(process.cwd(), "client", "dist"), // Alternative structure
        path.resolve(process.cwd(), "dist"), // Simple dist folder
        path.resolve(process.cwd(), "build"), // Create React App style
        path.resolve(process.cwd(), "public"), // Public folder
    ];

    let distPath = null;

    // Find the first path that exists
    for (const testPath of possiblePaths) {
        console.log(`Checking for build files at: ${testPath}`);
        if (fs.existsSync(testPath)) {
            // Check if it has an index.html file
            const indexPath = path.join(testPath, "index.html");
            if (fs.existsSync(indexPath)) {
                distPath = testPath;
                console.log(`Found build files at: ${distPath}`);
                break;
            }
        }
    }

    if (!distPath) {
        console.error("Build files not found in any of these locations:");
        possiblePaths.forEach((p) => console.error(`  - ${p}`));

        // List what's actually in the current directory
        console.log("Contents of current directory:", process.cwd());
        try {
            const contents = fs.readdirSync(process.cwd());
            contents.forEach((item) => {
                const itemPath = path.join(process.cwd(), item);
                const isDir = fs.statSync(itemPath).isDirectory();
                console.log(`  ${isDir ? "📁" : "📄"} ${item}`);
            });
        } catch (e) {
            console.error("Error reading directory:", e);
        }

        throw new Error(
            "Build files not found. Please build the client first."
        );
    }

    app.use(express.static(distPath));

    app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send(
                "Build files not found. Please build the client first."
            );
        }
    });
}
