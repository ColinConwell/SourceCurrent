import { create } from "zustand";
import { persist } from "zustand/middleware";

type DevelopmentModeStore = {
  isDevelopmentMode: boolean;
  toggleDevelopmentMode: () => void;
};

export const useDevelopmentMode = create<DevelopmentModeStore>()(
  persist(
    (set) => ({
      isDevelopmentMode: false,
      toggleDevelopmentMode: () => set((state) => ({ isDevelopmentMode: !state.isDevelopmentMode })),
    }),
    {
      name: "development-mode",
    }
  )
);
