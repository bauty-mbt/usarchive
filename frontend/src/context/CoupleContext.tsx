import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "../api/client";
import type { CoupleSummary, Theme } from "../types";
import { useAuth } from "./AuthContext";

interface CoupleContextValue {
  couple: CoupleSummary | null;
  myProfileId: string | null;
  partnerNickname: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [couple, setCouple] = useState<CoupleSummary | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api<{
        couple: CoupleSummary | null;
        myProfileId: string | null;
        partnerNickname: string | null;
      }>("/couples/me");
      setCouple(res.couple);
      setMyProfileId(res.myProfileId);
      setPartnerNickname(res.partnerNickname);
      if (res.couple) {
        document.documentElement.setAttribute("data-theme", res.couple.theme.toLowerCase() as Theme);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CoupleContext.Provider value={{ couple, myProfileId, partnerNickname, loading, refresh }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple debe usarse dentro de <CoupleProvider>");
  return ctx;
}
