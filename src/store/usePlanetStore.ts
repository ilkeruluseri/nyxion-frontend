// src/store/usePlanetStore.ts
import { create } from "zustand";

export interface PlanetConfig {
  planetRadius: number;
  orbitSpeed: number;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  color: string;
}

interface PlanetStore {
  planets: PlanetConfig[];
  visible: boolean[]; // which planets are currently shown
  setPlanets: (planets: PlanetConfig[]) => void;
  setVisibility: (visible: boolean[]) => void;
  setPlanetVisible: (index: number, visible: boolean) => void;
  clearPlanets: () => void;
}

export const usePlanetStore = create<PlanetStore>((set) => ({
    planets: [],
    visible: [],
    setPlanets: (planets) =>
    set({
        planets,
        visible: Array(planets.length).fill(false), // all hidden initially
    }),
    setVisibility: (visible) => set({ visible }),
    setPlanetVisible: (index, value) =>
        set((state) => {
          const updated = [...state.visible];
          updated[index] = value;
          return { visible: updated };
        }),
    clearPlanets: () => set({ planets: [], visible: []}),
}));
