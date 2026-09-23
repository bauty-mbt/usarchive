import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { assertProfileAccess } from "../services/authorization.service.js";

export const knowledgeRouter = Router();
knowledgeRouter.use(requireAuth);

// ---- Categorías (mapa/constelación) ----
knowledgeRouter.get("/profiles/:profileId/categories", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "read");
    const categories = await prisma.knowledgeCategory.findMany({
      where: { profileId: req.params.profileId },
      orderBy: { order: "asc" },
      include: { _count: { select: { entries: true } } },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// ---- "Descubrí algo" — crear entry ----
const entrySchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(140),
  description: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  link: z.string().url().optional(),
  confidence: z.enum(["ASSUMED", "LIKELY", "CONFIRMED", "TOLD_ME", "LIVED_IT"]).default("ASSUMED"),
  importance: z.number().int().min(1).max(5).default(3),
  discoveredAt: z.coerce.date().optional(),
  reasonToRemember: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

knowledgeRouter.post("/profiles/:profileId/entries", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "write");
    const data = entrySchema.parse(req.body);

    const entry = await prisma.knowledgeEntry.create({
      data: {
        profileId: req.params.profileId,
        categoryId: data.categoryId,
        authorId: req.userId!,
        title: data.title,
        description: data.description,
        photoUrl: data.photoUrl,
        link: data.link,
        confidence: data.confidence,
        importance: data.importance,
        discoveredAt: data.discoveredAt ?? new Date(),
        reasonToRemember: data.reasonToRemember,
        tags: {
          create: await Promise.all(
            data.tags.map(async (label) => {
              const tag = await prisma.tag.upsert({
                where: { label: label.toLowerCase() },
                create: { label: label.toLowerCase() },
                update: {},
              });
              return { tagId: tag.id };
            })
          ),
        },
      },
      include: { tags: { include: { tag: true } }, category: true },
    });

    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.get("/profiles/:profileId/entries", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "read");
    const categoryId = req.query.categoryId as string | undefined;
    const entries = await prisma.knowledgeEntry.findMany({
      where: { profileId: req.params.profileId, ...(categoryId ? { categoryId } : {}) },
      orderBy: { discoveredAt: "desc" },
      include: { tags: { include: { tag: true } }, category: true },
    });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

const updateSchema = entrySchema.partial();

knowledgeRouter.patch("/entries/:entryId", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.knowledgeEntry.findUnique({ where: { id: req.params.entryId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await assertProfileAccess(existing.profileId, req.userId!, "write");

    const data = updateSchema.parse(req.body);
    const entry = await prisma.knowledgeEntry.update({
      where: { id: req.params.entryId },
      data: {
        title: data.title,
        description: data.description,
        photoUrl: data.photoUrl,
        link: data.link,
        confidence: data.confidence,
        importance: data.importance,
        reasonToRemember: data.reasonToRemember,
      },
    });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

knowledgeRouter.delete("/entries/:entryId", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.knowledgeEntry.findUnique({ where: { id: req.params.entryId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await assertProfileAccess(existing.profileId, req.userId!, "write");

    await prisma.knowledgeEntry.delete({ where: { id: req.params.entryId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---- Gift Intelligence (heurística simple sin IA para el MVP) ----
knowledgeRouter.get("/profiles/:profileId/gift-ideas", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "read");

    const existing = await prisma.giftIdea.findMany({
      where: { profileId: req.params.profileId },
      orderBy: { createdAt: "desc" },
    });

    // Heurística MVP: entries en categoría "gifts"/"favorites" con importancia
    // alta que todavía no tienen una GiftIdea generada.
    const candidates = await prisma.knowledgeEntry.findMany({
      where: {
        profileId: req.params.profileId,
        importance: { gte: 4 },
        category: { key: { in: ["gifts", "favorites", "music"] } },
        giftIdeas: { none: {} },
      },
      take: 10,
    });

    const suggestions = candidates.map((c) => ({
      title: `Algo relacionado con: ${c.title}`,
      reason: `Marcaste esto con ${c.importance} de importancia.`,
      sourceEntryId: c.id,
    }));

    res.json({ saved: existing, suggestions });
  } catch (err) {
    next(err);
  }
});

const giftActionSchema = z.object({
  title: z.string().min(1).max(140),
  reason: z.string().max(300).optional(),
  sourceEntryId: z.string().optional(),
  status: z.enum(["SAVED", "GIVEN", "DISMISSED"]).default("SAVED"),
});

knowledgeRouter.post("/profiles/:profileId/gift-ideas", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "write");
    const data = giftActionSchema.parse(req.body);
    const idea = await prisma.giftIdea.create({
      data: { profileId: req.params.profileId, ...data },
    });
    res.status(201).json({ idea });
  } catch (err) {
    next(err);
  }
});
