export interface ScoringSystem {
  match: number;
  mismatch: number;
  gap: number;
}

export interface AlignmentResult {
  seq1Aligned: string;
  seq2Aligned: string;
  score: number;
  matrix: number[][];
  traceback: { row: number; col: number }[];
  executionTime: number;
}

export type Phase =
  | "idle"
  | "scanning"
  | "filling"
  | "traceback"
  | "revealing"
  | "done";

export const BASE_COLORS: Record<
  string,
  { pill: string; light: string; text: string; dot: string }
> = {
  A: { pill: "#E8F5E9", light: "#C8E6C9", text: "#2E7D32", dot: "#4CAF50" },
  T: { pill: "#E3F2FD", light: "#BBDEFB", text: "#1565C0", dot: "#2196F3" },
  G: { pill: "#FFF8E1", light: "#FFECB3", text: "#E65100", dot: "#FF9800" },
  C: { pill: "#F3E5F5", light: "#E1BEE7", text: "#6A1B9A", dot: "#9C27B0" },
};

export const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));
