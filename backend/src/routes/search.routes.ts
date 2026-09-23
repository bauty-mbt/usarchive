import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { assertProfileAccess } from "../services/authorization.service.js";

export const searchRouter = Router();
searchRouter.use(requireAuth);

const querySchema = z.object({
  profileId: z.string(),
  q: z.string().min(1).max(100),
});

// Busca en título, descripción, etiquetas y categoría. Server-side scoped
// al profile — nunca cruza a datos de otras couples/perfiles.
searchRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const { profileId, q } = querySchema.parse(req.query);
    await assertProfileAccess(profileId, req.userId!, "read");

    const [entries, memories] = await Promise.all([
      prisma.knowledgeEntry.findMany({
        where: {
          profileId,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { label: { contains: q, mode: "insensitive" } } },
            { tags: { some: { tag: { label: { contains: q, mode: "insensitive" } } } } },
          ],
        },
        include: { category: true, tags: { include: { tag: true } } },
        take: 25,
      }),
      prisma.memory.findMany({
        where: {
          profileId,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 15,
      }),
    ]);

    res.json({ entries, memories });
  } catch (err) {
    next(err);
  }
});

// "¿Cuánto conozco a mi pareja?" — cálculo simple y transparente, sin
// convertir esto en un ranking competitivo.
searchRouter.get("/knowledge-score/:profileId", async (req: AuthedRequest, res, next) => {
  try {
    await assertProfileAccess(req.params.profileId, req.userId!, "read");

    const categories = await prisma.knowledgeCategory.findMany({
      where: { profileId: req.params.profileId },
      include: { _count: { select: { entries: true } } },
    });

    const memoriesCount = await prisma.memory.count({ where: { profileId: req.params.profileId } });

    const exploredCategories = categories.filter((c) => c._count.entries > 0).length;
    const totalEntries = categories.reduce((sum, c) => sum + c._count.entries, 0);

    // Score orientativo: 40% cobertura de categorías, 40% volumen de
    // entries (con techo), 20% recuerdos registrados.
    const categoryScore = categories.length ? exploredCategories / categories.length : 0;
    const volumeScore = Math.min(totalEntries / 40, 1);
    const memoryScore = Math.min(memoriesCount / 15, 1);
    const score = Math.round((categoryScore * 0.4 + volumeScore * 0.4 + memoryScore * 0.2) * 100);

    res.json({
      score,
      exploredCategories,
      totalCategories: categories.length,
      incompleteCategories: categories.filter((c) => c._count.entries === 0).map((c) => c.label),
    });
  } catch (err) {
    next(err);
  }
});
