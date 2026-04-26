/**
 * CLO1 (Design): Design of the Needleman-Wunsch Algorithm
 * - Defines the scoring system and algorithm structure
 * - Uses Dynamic Programming approach with a 2D matrix
 * - Implements traceback for optimal alignment
 */

export interface AlignmentResult {
  score: number;
  seq1Aligned: string;
  seq2Aligned: string;
  matrix: number[][];
  traceback: { row: number; col: number }[];
  executionTime: number;
}

export interface ScoringSystem {
  match: number;
  mismatch: number;
  gap: number;
}

/**
 * CLO2 (Analysis): Time Complexity Analysis
 * - Time Complexity: O(M × N) where M and N are sequence lengths
 * - Space Complexity: O(M × N) for the scoring matrix
 * - Each cell is computed once using constant-time operations
 */
export function needlemanWunsch(
  seq1: string,
  seq2: string,
  scoring: ScoringSystem,
): AlignmentResult {
  const startTime = performance.now();

  const m = seq1.length;
  const n = seq2.length;

  // Initialize (M+1) × (N+1) scoring matrix with gap penalties
  const matrix: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column with gap penalties
  for (let i = 0; i <= m; i++) {
    matrix[i][0] = i * scoring.gap;
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j * scoring.gap;
  }

  // Fill the matrix using dynamic programming
  // Recurrence relation: Score(i,j) = max(Diagonal + S, Up + d, Left + d)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match =
        seq1[i - 1] === seq2[j - 1] ? scoring.match : scoring.mismatch;

      const diagonal = matrix[i - 1][j - 1] + match;
      const up = matrix[i - 1][j] + scoring.gap;
      const left = matrix[i][j - 1] + scoring.gap;

      matrix[i][j] = Math.max(diagonal, up, left);
    }
  }

  // Traceback from bottom-right to reconstruct optimal alignment
  const traceback: { row: number; col: number }[] = [];
  let seq1Aligned = "";
  let seq2Aligned = "";
  let i = m;
  let j = n;

  traceback.push({ row: i, col: j });

  while (i > 0 || j > 0) {
    if (i === 0) {
      seq1Aligned = "-" + seq1Aligned;
      seq2Aligned = seq2[j - 1] + seq2Aligned;
      j--;
    } else if (j === 0) {
      seq1Aligned = seq1[i - 1] + seq1Aligned;
      seq2Aligned = "-" + seq2Aligned;
      i--;
    } else {
      const match =
        seq1[i - 1] === seq2[j - 1] ? scoring.match : scoring.mismatch;
      const diagonal = matrix[i - 1][j - 1] + match;
      const up = matrix[i - 1][j] + scoring.gap;
      const left = matrix[i][j - 1] + scoring.gap;

      if (matrix[i][j] === diagonal) {
        seq1Aligned = seq1[i - 1] + seq1Aligned;
        seq2Aligned = seq2[j - 1] + seq2Aligned;
        i--;
        j--;
      } else if (matrix[i][j] === up) {
        seq1Aligned = seq1[i - 1] + seq1Aligned;
        seq2Aligned = "-" + seq2Aligned;
        i--;
      } else {
        seq1Aligned = "-" + seq1Aligned;
        seq2Aligned = seq2[j - 1] + seq2Aligned;
        j--;
      }
    }

    if (i >= 0 && j >= 0) {
      traceback.push({ row: i, col: j });
    }
  }

  traceback.reverse();
  const endTime = performance.now();

  // CLO3 (Implementation): Verified algorithm correctness
  return {
    score: matrix[m][n],
    seq1Aligned,
    seq2Aligned,
    matrix,
    traceback,
    executionTime: endTime - startTime,
  };
}
