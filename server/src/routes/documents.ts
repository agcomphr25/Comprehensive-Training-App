import { Router } from "express";
import { db } from "../db";
import {
  documents,
  documentCategories,
  documentCategoryLinks,
} from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const CategoryCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["department", "facility", "custom"]),
  description: z.string().optional(),
  departmentId: z.string().uuid().optional(),
});

const DocumentImportSchema = z.object({
  title: z.string().min(1),
  categoryIds: z.array(z.string().uuid()).optional(),
  newCategories: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["department", "facility", "custom"]),
  })).optional(),
});

router.get("/categories", async (_req, res) => {
  const rows = await db.select().from(documentCategories);
  res.json(rows);
});

router.post("/categories", async (req, res) => {
  const parsed = CategoryCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [row] = await db
    .insert(documentCategories)
    .values({
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      departmentId: parsed.data.departmentId ?? null,
    })
    .returning();
  res.json(row);
});

router.patch("/categories/:id", async (req, res) => {
  const parsed = CategoryCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [row] = await db
    .update(documentCategories)
    .set(parsed.data)
    .where(eq(documentCategories.id, req.params.id))
    .returning();
  res.json(row);
});

router.delete("/categories/:id", async (req, res) => {
  await db.delete(documentCategoryLinks).where(eq(documentCategoryLinks.categoryId, req.params.id));
  await db.delete(documentCategories).where(eq(documentCategories.id, req.params.id));
  res.json({ ok: true });
});

router.get("/", async (_req, res) => {
  const docs = await db.select().from(documents);
  const links = await db.select().from(documentCategoryLinks);
  const categories = await db.select().from(documentCategories);

  const docsWithCategories = docs.map(doc => ({
    ...doc,
    categories: links
      .filter(l => l.documentId === doc.id)
      .map(l => categories.find(c => c.id === l.categoryId))
      .filter(Boolean),
  }));

  res.json(docsWithCategories);
});

router.get("/:id", async (req, res) => {
  const [doc] = await db.select().from(documents).where(eq(documents.id, req.params.id));
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const links = await db.select().from(documentCategoryLinks).where(eq(documentCategoryLinks.documentId, doc.id));
  const categoryIds = links.map(l => l.categoryId);
  const categories = categoryIds.length > 0
    ? await db.select().from(documentCategories).where(inArray(documentCategories.id, categoryIds))
    : [];

  res.json({ ...doc, categories });
});

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { title, categoryIds, newCategories } = req.body;
    const parsedCategoryIds: string[] = categoryIds ? JSON.parse(categoryIds) : [];
    const parsedNewCategories: Array<{ name: string; type: string }> = newCategories ? JSON.parse(newCategories) : [];

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    let extractedText = "";
    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      extractedText = pdfData.text;
    } catch (e) {
      console.error("PDF parse error:", e);
      return res.status(400).json({ error: "Failed to parse PDF" });
    }

    const [doc] = await db
      .insert(documents)
      .values({
        title,
        fileName: req.file.originalname,
        extractedText,
        sourceType: "pdf",
        status: "ready",
        processedAt: new Date(),
      })
      .returning();

    const createdCategoryIds: string[] = [];
    for (const cat of parsedNewCategories) {
      const [newCat] = await db
        .insert(documentCategories)
        .values({
          name: cat.name,
          type: cat.type as "department" | "facility" | "custom",
        })
        .returning();
      createdCategoryIds.push(newCat.id);
    }

    const allCategoryIds = [...parsedCategoryIds, ...createdCategoryIds];
    for (const categoryId of allCategoryIds) {
      await db.insert(documentCategoryLinks).values({
        documentId: doc.id,
        categoryId,
      });
    }

    const categories = allCategoryIds.length > 0
      ? await db.select().from(documentCategories).where(inArray(documentCategories.id, allCategoryIds))
      : [];

    res.json({ ...doc, categories });
  } catch (e) {
    console.error("Import error:", e);
    res.status(500).json({ error: "Import failed" });
  }
});

router.delete("/:id", async (req, res) => {
  await db.delete(documentCategoryLinks).where(eq(documentCategoryLinks.documentId, req.params.id));
  await db.delete(documents).where(eq(documents.id, req.params.id));
  res.json({ ok: true });
});

export const documentsRouter = router;
