import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.SESSION_SECRET ?? "secret");
    (req as Request & { admin: unknown }).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
