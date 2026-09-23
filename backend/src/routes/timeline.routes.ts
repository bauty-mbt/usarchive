import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { assertCoupleMembership, getActiveCoupleForUser } from "../services/authorization.service.js";

export const timelineRouter = Router();
timelineRouter.use(requireAuth);

timelineRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const membership = await getActiveCoupleForUser(req.userId!);
    if (!membership) return res.json({ events: [] });

    const events = await prisma.timelineEvent.findMany({
      where: { coupleId: membership.coupleId },
      orderBy: { eventDate: "asc" },
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

const eventSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(1000).optional(),
  icon: z.string().max(8).default("⭐"),
  eventDate: z.coerce.date(),
});

timelineRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const membership = await getActiveCoupleForUser(req.userId!);
    if (!membership) return res.status(404).json({ error: "No tenés pareja activa" });
    await assertCoupleMembership(membership.coupleId, req.userId!);

    const data = eventSchema.parse(req.body);
    const event = await prisma.timelineEvent.create({
      data: { coupleId: membership.coupleId, ...data },
    });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});
