import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { assertProfileAccess } from "../services/authorization.service.js";

export const quizRouter = Router();
quizRouter.use(requireAuth);

/**
 * El quiz se arma EXCLUSIVAMENTE a partir de KnowledgeEntry ya guardados.
 * Nunca se inventa contenido: si no hay suficientes entries, se informa
 * en vez de rellenar con datos falsos.
 */
quizRouter.post("/profiles/:profileId/generate", async (req: AuthedRequest, res, next) => {
  try {
    // OJO: acá el que responde el quiz es la persona SOBRE quien trata el
    // profile (el subject), no el owner que escribió los datos. Se valida
    // que sea miembro de la couple y se usa lectura visible-al-subject.
    const profile = await prisma.profile.findUnique({ where: { id: req.params.profileId } });
    if (!profile) return res.status(404).json({ error: "No encontrado" });

    const entries = await prisma.knowledgeEntry.findMany({
      where: { profileId: profile.id, confidence: { in: ["CONFIRMED", "TOLD_ME", "LIVED_IT"] } },
      include: { category: true },
      take: 40,
    });

    if (entries.length < 4) {
      return res.status(422).json({ error: "Todavía no hay suficiente información confirmada para armar un quiz" });
    }

    const shuffled = [...entries].sort(() => Math.random() - 0.5).slice(0, 8);
    const quiz = await prisma.quiz.create({ data: { profileId: profile.id } });

    const questions = await Promise.all(
      shuffled.map(async (entry) => {
        const pool = entries
          .filter((e) => e.id !== entry.id && e.categoryId === entry.categoryId)
          .map((e) => e.title);
        const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
        return prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            entryId: entry.id,
            questionText: `¿Cuál de estas opciones sabés que es real sobre ${entry.category.label.toLowerCase()}?`,
            correctAnswer: entry.title,
            distractors,
          },
        });
      })
    );

    res.status(201).json({ quizId: quiz.id, questions });
  } catch (err) {
    next(err);
  }
});

const answerSchema = z.object({ correct: z.boolean() });

quizRouter.patch("/questions/:questionId/answer", async (req: AuthedRequest, res, next) => {
  try {
    const { correct } = answerSchema.parse(req.body);
    const question = await prisma.quizQuestion.update({
      where: { id: req.params.questionId },
      data: { answeredCorrectly: correct },
      include: { entry: true },
    });
    res.json({ question, discoveredAt: question.entry.discoveredAt });
  } catch (err) {
    next(err);
  }
});
