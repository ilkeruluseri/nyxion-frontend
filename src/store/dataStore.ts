import { create } from "zustand";

interface DataStore {
  rows: string[][];
  setCell: (rowIndex: number, colIndex: number, value: string) => void;
  addRow: () => void;
  reset: (rowCount?: number, colCount?: number) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  rows: [Array(7).fill("")],
  setCell: (rowIndex, colIndex, value) =>
    set((state) => {
      const updated = [...state.rows];
      updated[rowIndex] = [...updated[rowIndex]];
      updated[rowIndex][colIndex] = value;
      return { rows: updated };
    }),
  addRow: () =>
    set((state) => ({
      rows: [...state.rows, Array(state.rows[0]?.length || 7).fill("")],
    })),
  reset: (rowCount = 1, colCount = 7) =>
    set(() => ({
      rows: Array(rowCount).fill(null).map(() => Array(colCount).fill("")),
    })),
}));
