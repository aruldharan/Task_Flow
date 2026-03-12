import { Request, Response } from "express";
import prisma from "../prisma.js";
import { toCamelCase, toSnakeCase } from "../utils/case-converter.js";

export const getResource = (prismaModel: any, path: string, defaultIncludes = {}) => async (req: Request, res: Response) => {
  try {
    const { limit, isParent, recent, ...query } = toCamelCase(req.query);
    const where: any = { userId: (req as any).user.id };
    for (const [k, v] of Object.entries(query)) {
      if (k !== "userId") where[k] = v;
    }
    if (isParent === "true") where.parentTaskId = null;
    if (isParent === "false") where.parentTaskId = { not: null };
    if (recent === "30" && path === "habit-completions") {
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       where.completedDate = { gte: thirtyDaysAgo };
    }
    const options: any = { where, ...defaultIncludes };
    if (limit) options.take = parseInt(limit as string, 10);
    if (path === "tasks") options.orderBy = { position: "asc" };
    else options.orderBy = { createdAt: "desc" };

    let data = await prismaModel.findMany(options);
    res.json(data.map(toSnakeCase));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching data" });
  }
};

export const createResource = (prismaModel: any, path: string) => async (req: Request, res: Response) => {
  try {
    const data = toCamelCase(req.body);
    data.userId = (req as any).user.id;
    let result;
    if (path === "daily-notes") {
      const existing = await prismaModel.findFirst({ where: { userId: data.userId, noteDate: new Date(data.noteDate) } });
      if (existing) result = await prismaModel.update({ where: { id: existing.id }, data });
      else { data.noteDate = new Date(data.noteDate); result = await prismaModel.create({ data }); }
    } else if (path === "habit-completions") {
      const existing = await prismaModel.findFirst({ where: { userId: data.userId, habitId: data.habitId, completedDate: new Date(data.completedDate) } });
      if (existing) result = await prismaModel.delete({ where: { id: existing.id } });
      else { data.completedDate = new Date(data.completedDate); result = await prismaModel.create({ data }); }
    } else {
       if (data.dueDate) data.dueDate = new Date(data.dueDate);
       result = await prismaModel.create({ data });
    }
    res.json(result ? toSnakeCase(result) : { success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating record" });
  }
};

export const updateResource = (prismaModel: any, path: string) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === "mark-all-read" && path === "notifications") {
        await prismaModel.updateMany({ where: { userId: (req as any).user.id, read: false }, data: { read: true } });
        return res.json({ success: true });
    }
    const data = toCamelCase(req.body);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.endedAt) data.endedAt = new Date(data.endedAt);
    const record = await prismaModel.findFirst({ where: { id, userId: (req as any).user.id } });
    if (!record) return res.status(404).json({ message: "Not found" });
    const updated = await prismaModel.update({ where: { id }, data });
    res.json(toSnakeCase(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating record" });
  }
};

export const deleteResource = (prismaModel: any) => async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prismaModel.findFirst({ where: { id, userId: (req as any).user.id } });
    if (!record) return res.status(404).json({ message: "Not found" });
    await prismaModel.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting record" });
  }
};
