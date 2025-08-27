import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

export async function googleAuthHandler(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Missing token" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) throw new Error("Invalid token payload");

        const user = await storage.createOrUpdateGoogleUser({
            email: payload.email!,
            name: payload.name,
            googleId: payload.sub!,
            provider: "google",
        });

        // IMPORTANT: Always respond with valid JSON
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(401).json({ error: "Google authentication failed" });
    }
}
