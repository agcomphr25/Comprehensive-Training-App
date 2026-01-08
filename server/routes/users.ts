import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, users } from "../db";
import { createUserSchema, updateUserSchema } from "../../shared";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json({ success: true, data: allUsers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

router.post("/", async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.message });
  }
  try {
    const [newUser] = await db.insert(users).values(result.data).returning();
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create user" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.message });
  }
  try {
    const [updated] = await db
      .update(users)
      .set(result.data)
      .where(eq(users.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    if (!deleted) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

export { router as userRoutes };
