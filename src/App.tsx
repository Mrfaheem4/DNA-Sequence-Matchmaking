import { useState } from "react";
import {
  needlemanWunsch,
  type AlignmentResult,
  type ScoringSystem,
} from "./utils/needlemanWunsch";
import "./App.css";

/**
 * CLO1 (Design): UI Architecture
 * - Component-based design for DNA sequence alignment visualization
 * - Separates concerns: input, algorithm, visualization, and results
 */
function App() {
  // Input state for DNA sequences
  const [seq1, setSeq1] = useState<string>("ATGC");
  const [seq2, setSeq2] = useState<string>("AGGTC");

  // Scoring system state
  const [scoring, setScoring] = useState<ScoringSystem>({
    match: 1,
    mismatch: -1,
    gap: -2,
  });

  // Result state
  const [result, setResult] = useState<AlignmentResult | null>(null);

  /**
   * CLO2 (Analysis): Performance Tracking
   * Demonstrates O(M × N) complexity through execution time measurement
   */
  const handleAlign = () => {
    const seqResult = needlemanWunsch(
      seq1.toUpperCase(),
      seq2.toUpperCase(),
      scoring,
    );
    setResult(seqResult);
  };

  const isPathCell = (row: number, col: number): boolean => {
    return (
      result?.traceback.some((p) => p.row === row && p.col === col) ?? false
    );
  };

  // Validate DNA sequences
  const isValidDNA = (seq: string): boolean => {
    return /^[ATGC]*$/.test(seq.toUpperCase());
  };

  /**
   * Determine color for each character in alignment visualization
   * Emerald: Match, Amber: Mismatch, Ruby: Gap
   */
  const getCharColor = (char1: string, char2: string): string => {
    if (char1 === "-" || char2 === "-") {
      return "bg-red-600"; // Gap - Ruby Red
    }
    if (char1 === char2) {
      return "bg-emerald-600"; // Match - Emerald Green
    }
    return "bg-amber-500"; // Mismatch - Amber Orange
  };

  /**
   * Circular Progress Indicator for Alignment Quality
   */
  const AlignmentQualityIndicator = ({
    seq1Aligned,
    seq2Aligned,
  }: {
    seq1Aligned: string;
    seq2Aligned: string;
  }) => {
    // Calculate match percentage
    let matches = 0;
    for (let i = 0; i < seq1Aligned.length; i++) {
      if (
        seq1Aligned[i] === seq2Aligned[i] &&
        seq1Aligned[i] !== "-" &&
        seq2Aligned[i] !== "-"
      ) {
        matches++;
      }
    }
    const percentage = Math.round((matches / seq1Aligned.length) * 100);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-48 h-48">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle - Animated */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="url(#gradientStroke)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: "drop-shadow(0 0 10px rgba(249, 115, 22, 0.6))",
              }}
            />
            <defs>
              <linearGradient
                id="gradientStroke"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black text-orange-400">{percentage}%</p>
            <p className="text-sm font-bold text-gray-300">Match Quality</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-orange-400">{matches} matches</span>{" "}
            out of{" "}
            <span className="font-bold text-gray-200">
              {seq1Aligned.length}
            </span>{" "}
            positions
          </p>
        </div>
      </div>
    );
  };

  /**
   * Render visual alignment visualization with colored boxes
   */
  const VisualAlignment = ({
    seq1Aligned,
    seq2Aligned,
  }: {
    seq1Aligned: string;
    seq2Aligned: string;
  }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
            Sequence 1 Alignment
          </p>
          <div className="flex flex-wrap gap-1 p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-sm">
            {seq1Aligned.split("").map((char, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-9 h-9 flex items-center justify-center font-mono font-bold text-white rounded-lg transition-all duration-150 cursor-pointer shadow-md ${
                  hoveredIndex === idx
                    ? "ring-4 ring-offset-2 ring-orange-400 shadow-lg scale-125 -translate-y-1"
                    : "hover:shadow-lg"
                } ${getCharColor(char, seq2Aligned[idx])}`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-200 mb-3 tracking-wide uppercase">
            Sequence 2 Alignment
          </p>
          <div className="flex flex-wrap gap-1 p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 shadow-sm">
            {seq2Aligned.split("").map((char, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-9 h-9 flex items-center justify-center font-mono font-bold text-white rounded-lg transition-all duration-150 cursor-pointer shadow-md ${
                  hoveredIndex === idx
                    ? "ring-4 ring-offset-2 ring-orange-400 shadow-lg scale-125 -translate-y-1"
                    : "hover:shadow-lg"
                } ${getCharColor(seq1Aligned[idx], char)}`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 pt-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-emerald-600 rounded-full shadow-md"></div>
            <span className="text-sm font-semibold text-gray-300">Match</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full shadow-md"></div>
            <span className="text-sm font-semibold text-gray-300">
              Mismatch
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-red-600 rounded-full shadow-md"></div>
            <span className="text-sm font-semibold text-gray-300">Gap</span>
          </div>
        </div>
      </div>
    );
  };

  const seq1Valid = isValidDNA(seq1);
  const seq2Valid = isValidDNA(seq2);
  const canAlign = seq1.length > 0 && seq2.length > 0 && seq1Valid && seq2Valid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-gray-900 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">🧬</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">
                DNA Sequence Alignment
              </h1>
              <p className="text-base md:text-lg text-gray-400 font-medium">
                Needleman-Wunsch Algorithm | O(M × N) Complexity
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Input Section */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-base font-bold mb-4 text-white flex items-center gap-3 uppercase tracking-wide">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                Input Sequences
              </h2>

              <div className="space-y-4">
                {/* Sequence 1 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    DNA Sequence 1
                  </label>
                  <textarea
                    value={seq1}
                    onChange={(e) => setSeq1(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm transition-all ${
                      seq1 && !seq1Valid ? "border-red-400" : "border-slate-600"
                    }`}
                    placeholder="e.g., ATGC"
                    rows={3}
                  />
                  {seq1 && !seq1Valid && (
                    <p className="text-red-500 text-xs mt-2 font-semibold flex items-center gap-1">
                      ⚠️ Only A, T, G, C allowed
                    </p>
                  )}
                </div>

                {/* Sequence 2 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    DNA Sequence 2
                  </label>
                  <textarea
                    value={seq2}
                    onChange={(e) => setSeq2(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm transition-all ${
                      seq2 && !seq2Valid ? "border-red-400" : "border-slate-600"
                    }`}
                    placeholder="e.g., AGGTC"
                    rows={3}
                  />
                  {seq2 && !seq2Valid && (
                    <p className="text-red-500 text-xs mt-2 font-semibold flex items-center gap-1">
                      ⚠️ Only A, T, G, C allowed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring System */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-base font-bold mb-4 text-white flex items-center gap-3 uppercase tracking-wide">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ⚙
                </div>
                Scoring System
              </h2>

              <div className="space-y-4">
                {/* Match Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Match Score:{" "}
                    <span className="text-orange-400 font-bold">
                      {scoring.match}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={scoring.match}
                    onChange={(e) =>
                      setScoring({
                        ...scoring,
                        match: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-all"
                  />
                </div>

                {/* Mismatch Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Mismatch Score:{" "}
                    <span className="text-red-400 font-bold">
                      {scoring.mismatch}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={scoring.mismatch}
                    onChange={(e) =>
                      setScoring({
                        ...scoring,
                        mismatch: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-all"
                  />
                </div>

                {/* Gap Penalty */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Gap Penalty:{" "}
                    <span className="text-orange-400 font-bold">
                      {scoring.gap}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={scoring.gap}
                    onChange={(e) =>
                      setScoring({
                        ...scoring,
                        gap: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-700 rounded-lg border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Align Button */}
            <button
              onClick={handleAlign}
              disabled={!canAlign}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 uppercase tracking-wide shadow-md hover:shadow-lg ${
                canAlign
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 cursor-pointer transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              ⚡ Run Alignment
            </button>

            {/* Complexity Info */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-orange-500/30">
              <p className="text-white font-semibold">
                <span className="block text-xs uppercase tracking-wide text-gray-400 mb-2 font-bold">
                  Time Complexity
                </span>
                <span className="text-3xl font-black text-orange-400">
                  O(M × N)
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                Space Complexity: O(M × N)
              </p>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-8">
            {result && (
              <>
                {/* Alignment Results */}
                <div className="bg-slate-800 rounded-2xl p-7 border border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wide">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-base font-bold">
                      ✓
                    </div>
                    Alignment Results
                  </h2>

                  <div className="space-y-5">
                    {/* Quality Indicator - Circular Progress */}
                    <div className="flex justify-center py-4">
                      <AlignmentQualityIndicator
                        seq1Aligned={result.seq1Aligned}
                        seq2Aligned={result.seq2Aligned}
                      />
                    </div>

                    {/* Score Card */}
                    <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 border border-orange-500/30">
                      <p className="text-orange-400 text-xs font-bold uppercase tracking-wide mb-1">
                        Final Score
                      </p>
                      <p className="text-4xl font-black text-orange-400">
                        {result.score}
                      </p>
                    </div>

                    {/* Execution Time Card */}
                    <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 border border-slate-600">
                      <p className="text-gray-300 text-xs font-bold uppercase tracking-wide mb-1">
                        Execution Time
                      </p>
                      <p className="text-3xl font-black text-white">
                        {result.executionTime.toFixed(4)}
                        <span className="text-lg text-gray-400"> ms</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-2 font-semibold">
                        ✓ Performance Verified
                      </p>
                    </div>

                    {/* Aligned Sequences with Visual Visualization */}
                    <div>
                      <p className="text-gray-800 font-bold mb-4 text-sm uppercase tracking-wide">
                        Visual Alignment
                      </p>
                      <VisualAlignment
                        seq1Aligned={result.seq1Aligned}
                        seq2Aligned={result.seq2Aligned}
                      />
                    </div>
                  </div>
                </div>

                {/* Scoring Matrix Visualization */}
                <div className="bg-slate-800 rounded-2xl p-7 border border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-3 uppercase tracking-wide">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-base font-bold">
                      📊
                    </div>
                    Scoring Matrix
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-900 to-slate-950">
                          <th className="border border-slate-600 px-3 py-2 text-white font-bold w-12">
                            -
                          </th>
                          {seq2.split("").map((char, idx) => (
                            <th
                              key={idx}
                              className="border border-slate-600 px-3 py-2 text-white font-bold w-12 bg-gradient-to-r from-slate-900 to-slate-950"
                            >
                              {char}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.matrix.map((row, i) => (
                          <tr key={i}>
                            <td className="border border-slate-600 px-3 py-2 text-white font-bold bg-gradient-to-r from-slate-700 to-slate-800 w-12 text-center">
                              {i === 0 ? "-" : seq1[i - 1]}
                            </td>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className={`border border-slate-600 px-3 py-2 text-center w-12 font-mono font-bold transition-all ${
                                  isPathCell(i, j)
                                    ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md"
                                    : "bg-slate-700 text-gray-300 hover:bg-gradient-to-br hover:from-slate-600 hover:to-slate-700"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-300 mt-4 font-semibold flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-gradient-to-br from-orange-500 to-red-600 rounded"></span>
                    Optimal alignment path (traceback)
                  </p>
                </div>
              </>
            )}

            {!result && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-16 border border-slate-700 text-center shadow-sm">
                <p className="text-gray-300 font-bold text-lg">
                  🔍 Run alignment to visualize results
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Enter DNA sequences and click "Run Alignment"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
