import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { assertProfileAccess } from "../services/authorization.service.js";

export const memoryRouter = Router();
memoryRouter.use(requireAuth);

const memorySchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(3000).optional(),
  happenedAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  song: z.string().max(200).optional(),
  emotion: z.string().max(60).optional(),
  photoUrls: z.array(z.string().url()).max(10).default([]),
});

memoryRouter.get("/profiles/:profileId/memories", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "read");
    const memories = await prisma.memory.findMany({
      where: { profileId: req.params.profileId },
      orderBy: { happenedAt: "desc" },
      include: { media: true },
    });
    res.json({ memories });
  } catch (err) {
    next(err);
  }
});

memoryRouter.post("/profiles/:profileId/memories", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "write");
    const data = memorySchema.parse(req.body);

    const memory = await prisma.memory.create({
      data: {
        profileId: req.params.profileId,
        authorId: req.userId!,
        title: data.title,
        description: data.description,
        happenedAt: data.happenedAt,
        location: data.location,
        song: data.song,
        emotion: data.emotion,
        media: { create: data.photoUrls.map((url) => ({ url, kind: "image" })) },
      },
      include: { media: true },
    });

    res.status(201).json({ memory });
  } catch (err) {
    next(err);
  }
});

memoryRouter.delete("/memories/:memoryId", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.memory.findUnique({ where: { id: req.params.memoryId } });
    if (!existing) return res.status(404).json({ error: "No encontrado" });
    await assertProfileAccess(existing.profileId, req.userId!, "write");

    await prisma.memory.delete({ where: { id: req.params.memoryId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
