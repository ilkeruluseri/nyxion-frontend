import { create } from "zustand";

interface DataStore {
  rows: string[][];
  setCell: (rowIndex: number, colIndex: number, value: string) => void;
  addRow: () => void;
  reset: (rowCount?: number, colCount?: number) => void;
    setRows: (rows: string[][]) => void;
}

// store/dataStore.ts
export const useDataStore = create<DataStore>((set) => ({
rows: [Array(8).fill("")],  // 👈 8 columns instead of 7
    setCell: (rowIndex, colIndex, value) =>
        set((state) => {
        const updated = [...state.rows];
        updated[rowIndex] = [...updated[rowIndex]];
        updated[rowIndex][colIndex] = value;
        return { rows: updated };
        }),
    addRow: () =>
        set((state) => ({
        rows: [...state.rows, Array(state.rows[0]?.length || 8).fill("")], // 👈 use 8
        })),
    reset: (rowCount = 1, colCount = 8) =>  // 👈 reset to 8
        set(() => ({
        rows: Array(rowCount)
            .fill(null)
            .map(() => Array(colCount).fill("")),
        })),
    setRows: (rows: string[][]) =>
        set(() => ({
        rows: rows.map((r) => r.slice(0, 8)), // 👈 trim to 8 cols
        })),
    }));
  
