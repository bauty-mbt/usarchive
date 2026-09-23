import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/crypto.js";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Autenticación real vía Authorization: Bearer <accessToken>.
 * No confía en nada que venga del cliente sin verificar la firma.
 * Cualquier ruta protegida DEBE pasar por acá antes de tocar datos.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
