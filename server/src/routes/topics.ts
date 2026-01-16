import { Router } from "express";
import { db } from "../db";
import {
  trainingTopics,
  topicDocuments,
  topicContent,
  topicQuizQuestions,
  documents,
  traineeTopicAssignments,
  trainees,
  trainingPlans,
  trainingPlanDays,
} from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { generateTrainingTopicContent, generateTopicQuizQuestions } from "../services/ai";

const router = Router();

const TopicCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  documentIds: z.array(z.string().uuid()),
});

const AssignTopicsSchema = z.object({
  traineeId: z.string().uuid(),
  topicIds: z.array(z.string().uuid()),
  trainerName: z.string().min(1),
  targetLevel: z.enum(["basic", "intermediate", "advanced"]).optional(),
  startDate: z.string().optional(),
});

router.get("/", async (_req, res) => {
  const topics = await db.select().from(trainingTopics);
  const topicDocs = await db.select().from(topicDocuments);
  const docs = await db.select().from(documents);
  const content = await db.select().from(topicContent);
  const questions = await db.select().from(topicQuizQuestions);

  const topicsWithData = topics.map(topic => ({
    ...topic,
    documents: topicDocs
      .filter(td => td.topicId === topic.id)
      .map(td => docs.find(d => d.id === td.documentId))
      .filter(Boolean),
    content: content.filter(c => c.topicId === topic.id).sort((a, b) => a.stepNumber - b.stepNumber),
    questionCount: questions.filter(q => q.topicId === topic.id && q.active).length,
  }));

  res.json(topicsWithData);
});

router.get("/:id", async (req, res) => {
  const [topic] = await db.select().from(trainingTopics).where(eq(trainingTopics.id, req.params.id));
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const topicDocs = await db.select().from(topicDocuments).where(eq(topicDocuments.topicId, topic.id));
  const docIds = topicDocs.map(td => td.documentId);
  const docs = docIds.length > 0
    ? await db.select().from(documents).where(inArray(documents.id, docIds))
    : [];

  const content = await db.select().from(topicContent).where(eq(topicContent.topicId, topic.id));
  const questions = await db.select().from(topicQuizQuestions).where(eq(topicQuizQuestions.topicId, topic.id));

  res.json({
    ...topic,
    documents: docs,
    content: content.sort((a, b) => a.stepNumber - b.stepNumber),
    questions,
  });
});

router.post("/", async (req, res) => {
  const parsed = TopicCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { title, description, documentIds } = parsed.data;

  const [topic] = await db
    .insert(trainingTopics)
    .values({
      title,
      description: description ?? null,
      status: "generating",
    })
    .returning();

  for (const docId of documentIds) {
    await db.insert(topicDocuments).values({
      topicId: topic.id,
      documentId: docId,
    });
  }

  generateTopicContentAsync(topic.id, title, documentIds);

  res.json(topic);
});

async function generateTopicContentAsync(topicId: string, title: string, documentIds: string[]) {
  try {
    const docs = await db.select().from(documents).where(inArray(documents.id, documentIds));
    const documentTexts = docs.map(d => d.extractedText || "").filter(t => t.length > 0);

    if (documentTexts.length === 0) {
      await db.update(trainingTopics)
        .set({ status: "failed", error: "No document text available" })
        .where(eq(trainingTopics.id, topicId));
      return;
    }

    const [contentResult, questionsResult] = await Promise.all([
      generateTrainingTopicContent(title, documentTexts),
      generateTopicQuizQuestions(title, documentTexts),
    ]);

    for (const step of contentResult) {
      await db.insert(topicContent).values({
        topicId,
        stepNumber: step.stepNumber,
        stepTitle: step.stepTitle,
        trainerScript: step.trainerScript,
        traineeActivity: step.traineeActivity,
        keyPoints: step.keyPoints,
        checklistItems: step.checklistItems,
        estimatedMinutes: step.estimatedMinutes,
      });
    }

    for (const q of questionsResult) {
      await db.insert(topicQuizQuestions).values({
        topicId,
        question: q.question,
        type: q.type,
        meta: { choices: q.choices || [], answer: q.answer },
      });
    }

    await db.update(trainingTopics)
      .set({ status: "ready", generatedAt: new Date() })
      .where(eq(trainingTopics.id, topicId));

  } catch (e) {
    console.error("Topic generation error:", e);
    await db.update(trainingTopics)
      .set({ status: "failed", error: String(e) })
      .where(eq(trainingTopics.id, topicId));
  }
}

router.post("/:id/regenerate", async (req, res) => {
  const [topic] = await db.select().from(trainingTopics).where(eq(trainingTopics.id, req.params.id));
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  await db.delete(topicContent).where(eq(topicContent.topicId, topic.id));
  await db.delete(topicQuizQuestions).where(eq(topicQuizQuestions.topicId, topic.id));

  await db.update(trainingTopics)
    .set({ status: "generating", error: null, generatedAt: null })
    .where(eq(trainingTopics.id, topic.id));

  const topicDocs = await db.select().from(topicDocuments).where(eq(topicDocuments.topicId, topic.id));
  const docIds = topicDocs.map(td => td.documentId);

  generateTopicContentAsync(topic.id, topic.title, docIds);

  res.json({ ok: true, message: "Regeneration started" });
});

router.delete("/:id", async (req, res) => {
  await db.delete(topicContent).where(eq(topicContent.topicId, req.params.id));
  await db.delete(topicQuizQuestions).where(eq(topicQuizQuestions.topicId, req.params.id));
  await db.delete(topicDocuments).where(eq(topicDocuments.topicId, req.params.id));
  await db.delete(traineeTopicAssignments).where(eq(traineeTopicAssignments.topicId, req.params.id));
  await db.delete(trainingTopics).where(eq(trainingTopics.id, req.params.id));
  res.json({ ok: true });
});

router.get("/assignments", async (_req, res) => {
  const assignments = await db.select().from(traineeTopicAssignments);
  const allTrainees = await db.select().from(trainees);
  const topics = await db.select().from(trainingTopics);

  const withDetails = assignments.map(a => ({
    ...a,
    trainee: allTrainees.find(t => t.id === a.traineeId),
    topic: topics.find(t => t.id === a.topicId),
  }));

  res.json(withDetails);
});

router.post("/assign", async (req, res) => {
  const parsed = AssignTopicsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { traineeId, topicIds, trainerName, targetLevel, startDate } = parsed.data;

  const [trainee] = await db.select().from(trainees).where(eq(trainees.id, traineeId));
  if (!trainee) return res.status(404).json({ error: "Trainee not found" });

  const topics = await db.select().from(trainingTopics).where(inArray(trainingTopics.id, topicIds));
  if (topics.length !== topicIds.length) {
    return res.status(400).json({ error: "Some topics not found" });
  }

  const readyTopics = topics.filter(t => t.status === "ready");
  if (readyTopics.length === 0) {
    return res.status(400).json({ error: "No topics are ready for assignment" });
  }

  const [plan] = await db
    .insert(trainingPlans)
    .values({
      traineeId,
      trainerName,
      title: `${trainee.name} - ${readyTopics.map(t => t.title).join(", ")}`,
      startDate: startDate ? new Date(startDate) : null,
      status: "draft",
    })
    .returning();

  const stepFocusTitles = [
    "Step 1: Trainer Does / Trainer Explains",
    "Step 2: Trainer Does / Trainee Explains",
    "Step 3: Trainee Does / Trainer Coaches",
    "Step 4: Trainee Does / Trainer Observes",
  ];

  for (let dayNum = 1; dayNum <= 4; dayNum++) {
    await db.insert(trainingPlanDays).values({
      planId: plan.id,
      dayNumber: dayNum,
      stepFocus: stepFocusTitles[dayNum - 1],
      objectives: `Focus on Step ${dayNum} for all assigned topics`,
      status: "pending",
    });
  }

  const createdAssignments = [];
  for (const topic of readyTopics) {
    const [assignment] = await db
      .insert(traineeTopicAssignments)
      .values({
        traineeId,
        topicId: topic.id,
        targetLevel: targetLevel || "basic",
        status: "assigned",
        trainingPlanId: plan.id,
      })
      .returning();
    createdAssignments.push(assignment);
  }

  res.json({
    plan,
    assignments: createdAssignments,
    message: `Created 4-day training plan with ${readyTopics.length} topics`,
  });
});

router.get("/:id/content", async (req, res) => {
  const content = await db.select().from(topicContent).where(eq(topicContent.topicId, req.params.id));
  res.json(content.sort((a, b) => a.stepNumber - b.stepNumber));
});

router.get("/:id/questions", async (req, res) => {
  const questions = await db.select().from(topicQuizQuestions).where(eq(topicQuizQuestions.topicId, req.params.id));
  res.json(questions);
});

export const topicsRouter = router;
