import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/** Nunca loguear passwords, tokens ni contenido privado del usuario. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", details: err.flatten() });
  }

  const anyErr = err as { status?: number; message?: string };
  const status = anyErr.status ?? 500;
  const message = status === 500 ? "Error interno" : anyErr.message ?? "Error";

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error("[unhandled]", err);
  }

  res.status(status).json({ error: message });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "No encontrado" });
}
