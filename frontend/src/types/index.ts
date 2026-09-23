export type Theme = "garden" | "midnight" | "paper" | "digital" | "sunset" | "cosmic" | "minimal" | "custom";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface CoupleSummary {
  id: string;
  theme: string;
  status: "PENDING" | "ACTIVE";
  members: { nickname: string; userId: string }[];
}

export type Confidence = "ASSUMED" | "LIKELY" | "CONFIRMED" | "TOLD_ME" | "LIVED_IT";

export const confidenceMeta: Record<Confidence, { label: string; icon: string }> = {
  ASSUMED: { label: "Creo", icon: "🤔" },
  LIKELY: { label: "Probablemente", icon: "🟡" },
  CONFIRMED: { label: "Confirmado", icon: "🟢" },
  TOLD_ME: { label: "Me lo contó", icon: "💬" },
  LIVED_IT: { label: "Lo viví con ella", icon: "❤️" },
};

export interface KnowledgeCategory {
  id: string;
  key: string;
  label: string;
  icon: string;
  order: number;
  _count: { entries: number };
}

export interface Tag {
  id: string;
  label: string;
}

export interface KnowledgeEntry {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  photoUrl?: string | null;
  link?: string | null;
  confidence: Confidence;
  importance: number;
  discoveredAt: string;
  reasonToRemember?: string | null;
  category: KnowledgeCategory;
  tags: { tag: Tag }[];
}

export interface Memory {
  id: string;
  title: string;
  description?: string | null;
  happenedAt?: string | null;
  location?: string | null;
  song?: string | null;
  emotion?: string | null;
  media: { id: string; url: string; kind: string }[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  eventDate: string;
}
