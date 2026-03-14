import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "./GameContext";
import { applyLanguageStage, type LanguageStage } from "@/lib/languageStage";

interface LanguageStageContextType {
  stage: LanguageStage;
  t: (text: string) => string;
}

const LanguageStageContext = createContext<LanguageStageContextType>({
  stage: 1,
  t: (text) => text,
});

export function LanguageStageProvider({ children }: { children: React.ReactNode }) {
  const { player } = useGame();

  const { data: homeData } = useQuery<{ userLanguageStage: LanguageStage }>({
    queryKey: ["home", player?.id],
    queryFn: async () => {
      const res = await fetch(`/api/player/${player!.id}/home`);
      return res.json();
    },
    enabled: !!player?.id,
    staleTime: 30000,
    select: (data: any) => ({ userLanguageStage: data.userLanguageStage ?? 1 }),
  });

  const stage = homeData?.userLanguageStage ?? 1;

  const t = useCallback(
    (text: string) => applyLanguageStage(text, stage),
    [stage]
  );

  const value = useMemo(() => ({ stage, t }), [stage, t]);

  return (
    <LanguageStageContext.Provider value={value}>
      {children}
    </LanguageStageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageStageContext);
}
