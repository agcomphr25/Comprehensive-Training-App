import { Router } from "express";
import { db } from "../db";
import { roles } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const libraryRouter = Router();

const RoleCreate = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

libraryRouter.get("/roles", async (_req, res) => {
  const rows = await db.select().from(roles);
  res.json(rows);
});

libraryRouter.post("/roles", async (req, res) => {
  const parsed = RoleCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [row] = await db
    .insert(roles)
    .values({ name: parsed.data.name, description: parsed.data.description ?? null })
    .returning();

  res.json(row);
});

libraryRouter.delete("/roles/:id", async (req, res) => {
  const id = req.params.id;
  await db.delete(roles).where(eq(roles.id, id));
  res.json({ ok: true });
});
