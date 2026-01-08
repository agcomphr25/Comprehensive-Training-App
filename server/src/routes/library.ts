import { Router } from "express";
export const libraryRouter = Router();

libraryRouter.get("/", (_req, res) => {
  res.json({ success: true, data: [] });
});
