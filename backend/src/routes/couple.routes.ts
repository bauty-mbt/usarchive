import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "../config/db.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { getActiveCoupleForUser } from "../services/authorization.service.js";

export const coupleRouter = Router();
coupleRouter.use(requireAuth);

// Alfabeto sin caracteres ambiguos (0/O, 1/I) para códigos que se leen en voz alta.
const genCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

const defaultCategories = [
  { key: "music", label: "Música", icon: "🎵" },
  { key: "food", label: "Comida", icon: "🍜" },
  { key: "culture", label: "Cultura", icon: "🎬" },
  { key: "gifts", label: "Regalos", icon: "🎁" },
  { key: "favorites", label: "Favoritos", icon: "🌸" },
  { key: "personality", label: "Personalidad", icon: "🧠" },
  { key: "places", label: "Lugares", icon: "📍" },
  { key: "details", label: "No quiero olvidarlo", icon: "💭" },
];

// Paso 3 del onboarding: crear la couple + invitación.
const createSchema = z.object({
  myNickname: z.string().min(1).max(40),
  partnerName: z.string().min(1).max(40), // solo referencial hasta que se vincule
});

coupleRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await getActiveCoupleForUser(req.userId!);
    if (existing) return res.status(409).json({ error: "Ya tenés una pareja activa" });

    const data = createSchema.parse(req.body);

    const couple = await prisma.couple.create({
      data: {
        status: "PENDING",
        members: { create: { userId: req.userId!, nickname: data.myNickname } },
      },
      include: { members: true },
    });

    const code = `INV-${genCode()}`;
    await prisma.invitation.create({
      data: {
        coupleId: couple.id,
        code,
        createdBy: req.userId!,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    res.status(201).json({ coupleId: couple.id, invitationCode: code });
  } catch (err) {
    next(err);
  }
});

// Paso 4: la otra persona usa el código para vincularse.
const joinSchema = z.object({
  code: z.string().min(4),
  myNickname: z.string().min(1).max(40),
});

coupleRouter.post("/join", async (req: AuthedRequest, res, next) => {
  try {
    const already = await getActiveCoupleForUser(req.userId!);
    if (already) return res.status(409).json({ error: "Ya tenés una pareja activa" });

    const data = joinSchema.parse(req.body);
    const invitation = await prisma.invitation.findUnique({
      where: { code: data.code },
      include: { couple: { include: { members: true } } },
    });

    if (!invitation) return res.status(404).json({ error: "Código inválido" });
    if (invitation.usedAt) return res.status(409).json({ error: "Ese código ya fue usado" });
    if (invitation.expiresAt < new Date())
      return res.status(410).json({ error: "El código expiró" });
    if (invitation.couple.members.some((m) => m.userId === req.userId))
      return res.status(409).json({ error: "Ya formás parte de esta pareja" });
    if (invitation.couple.members.length >= 2)
      return res.status(409).json({ error: "Esta pareja ya está completa" });

    const [, couple] = await prisma.$transaction([
      prisma.coupleMember.create({
        data: {
          coupleId: invitation.coupleId,
          userId: req.userId!,
          nickname: data.myNickname,
        },
      }),
      prisma.couple.update({
        where: { id: invitation.coupleId },
        data: { status: "ACTIVE" },
        include: { members: true },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Crear, para cada miembro, su espacio de escritura sobre el otro,
    // con las categorías por defecto ya cargadas.
    const [memberA, memberB] = couple.members;
    for (const [owner, subject] of [
      [memberA, memberB],
      [memberB, memberA],
    ] as const) {
      const profile = await prisma.profile.create({
        data: {
          coupleId: couple.id,
          ownerId: owner.userId,
          subjectMemberId: subject.id,
        },
      });
      await prisma.knowledgeCategory.createMany({
        data: defaultCategories.map((c, i) => ({ ...c, profileId: profile.id, order: i })),
      });
    }

    res.status(200).json({ coupleId: couple.id });
  } catch (err) {
    next(err);
  }
});

coupleRouter.get("/me", async (req: AuthedRequest, res, next) => {
  try {
    const membership = await getActiveCoupleForUser(req.userId!);
    if (!membership) return res.json({ couple: null });

    const couple = await prisma.couple.findUnique({
      where: { id: membership.coupleId },
      include: {
        members: { include: { user: { select: { id: true, displayName: true } } } },
        profiles: true,
      },
    });

    // Exponer solo el/los profileId que le pertenecen a este user (el que
    // escribe), nunca los internals del otro. La lectura del ajeno pasa
    // siempre por assertProfileAccess en su propio endpoint.
    const myProfile = couple?.profiles.find((p) => p.ownerId === req.userId);
    const partnerMember = couple?.members.find((m) => m.userId !== req.userId);

    res.json({
      couple: couple && {
        id: couple.id,
        theme: couple.theme,
        status: couple.status,
        members: couple.members.map((m) => ({ nickname: m.nickname, userId: m.userId })),
      },
      myProfileId: myProfile?.id ?? null,
      partnerNickname: partnerMember?.nickname ?? null,
    });
  } catch (err) {
    next(err);
  }
});

coupleRouter.patch("/theme", async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      theme: z.enum(["GARDEN", "MIDNIGHT", "PAPER", "DIGITAL", "SUNSET", "COSMIC", "MINIMAL", "CUSTOM"]),
    });
    const { theme } = schema.parse(req.body);
    const membership = await getActiveCoupleForUser(req.userId!);
    if (!membership) return res.status(404).json({ error: "No tenés pareja activa" });

    await prisma.couple.update({ where: { id: membership.coupleId }, data: { theme } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
