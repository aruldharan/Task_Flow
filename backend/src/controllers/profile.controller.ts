import { Request, Response } from "express";

export const getAvatar = (req: Request, res: Response) => {
    res.json({ avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (req as any).user.id });
};
