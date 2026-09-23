import { prisma } from "../config/db.js";

/**
 * Toda esta capa existe para un solo propósito: nunca confiar en que un
 * profileId/entryId/memoryId "parece" pertenecerle al usuario porque vino
 * en la URL. Cada acceso se resuelve contra la base, siempre.
 */

export class ForbiddenError extends Error {
  status = 403;
}
export class NotFoundError extends Error {
  status = 404;
}

/** El profile SOLO puede ser editado por su owner. Lectura: owner siempre;
 *  el subject solo si el owner activó visibleToSubject. */
export async function assertProfileAccess(
  profileId: string,
  userId: string,
  mode: "read" | "write"
) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { couple: { include: { members: true } } },
  });
  if (!profile) throw new NotFoundError("Perfil no encontrado");

  const isOwner = profile.ownerId === userId;
  if (mode === "write") {
    if (!isOwner) throw new ForbiddenError("No tenés permiso para editar este espacio");
    return profile;
  }

  // read
  if (isOwner) return profile;

  const subjectMember = profile.couple.members.find(
    (m) => m.id === profile.subjectMemberId
  );
  const isSubject = subjectMember?.userId === userId;
  if (isSubject && profile.visibleToSubject) return profile;

  throw new ForbiddenError("No tenés permiso para ver este espacio");
}

/** Confirma que el usuario pertenece a la couple dueña del recurso (timeline, etc). */
export async function assertCoupleMembership(coupleId: string, userId: string) {
  const member = await prisma.coupleMember.findFirst({
    where: { coupleId, userId },
  });
  if (!member) throw new ForbiddenError("No pertenecés a esta pareja");
  return member;
}

/** Dado un userId, devuelve su couple activa (o null). Un usuario pertenece
 * a lo sumo a una couple activa en el MVP. */
export async function getActiveCoupleForUser(userId: string) {
  const membership = await prisma.coupleMember.findFirst({
    where: { userId, couple: { status: "ACTIVE" } },
    include: { couple: true },
  });
  return membership;
}
