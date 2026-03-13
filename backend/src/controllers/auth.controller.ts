import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-local-dev";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const userCount = await prisma.user.count();
    const role: "owner" | "member" = userCount === 0 ? "owner" : "member";

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            displayName: displayName || email.split("@")[0],
          }
        },
        userRoles: {
          create: {
            role: role
          }
        }
      },
      include: { 
        profile: true,
        userRoles: true
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, display_name: (user.profile as any)?.displayName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID Token missing" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: "Invalid Google token" });

    const { email, name, picture } = payload;
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      const userCount = await prisma.user.count();
      const role: "owner" | "member" = userCount === 0 ? "owner" : "member";
      
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: {
              displayName: name || email.split("@")[0],
              avatarUrl: picture,
            }
          },
          userRoles: {
            create: {
              role: role
            }
          }
        },
        include: { profile: true }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, display_name: (user.profile as any)?.displayName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google auth failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, display_name: (user.profile as any)?.displayName } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, userRoles: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        display_name: (user.profile as any)?.displayName 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
