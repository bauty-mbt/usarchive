import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../config/db.js";
import { hashSecret, verifySecret, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/crypto.js";
import { env } from "../config/env.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

// Freno de fuerza bruta sobre login/registro.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
});
authRouter.use(authLimiter);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
});

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Ese email ya está registrado" });

    const passwordHash = await hashSecret(data.password);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, displayName: data.displayName },
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 86400000),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // Mensaje genérico a propósito: no revelar si el email existe.
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await verifySecret(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 86400000),
      },
    });

    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No hay sesión" });

    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Sesión inválida" });
    }

    const payload = verifyRefreshToken(token); // valida firma y expiración
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Sesión inválida" });

    // Rotación de refresh token: el usado se revoca y se emite uno nuevo.
    const newRefresh = signRefreshToken(user.id);
    await prisma.$transaction([
      prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: newRefresh,
          userAgent: req.headers["user-agent"],
          ip: req.ip,
          expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 86400000),
        },
      }),
    ]);

    setRefreshCookie(res, newRefresh);
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Sesión inválida" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await prisma.session.updateMany({
      where: { refreshToken: token },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Privacy Center: listar y revocar sesiones/dispositivos activos.
authRouter.get("/sessions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId, revokedAt: null },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

authRouter.delete("/sessions/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await prisma.session.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { revokedAt: new Date() },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
