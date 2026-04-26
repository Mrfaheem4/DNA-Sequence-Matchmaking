import { useState, useEffect, useRef } from "react";
import {
  needlemanWunsch,
  type AlignmentResult,
  type ScoringSystem,
} from "./utils/needlemanWunsch";
import "./App.css";

// ─── Animated DNA helix background ───────────────────────────────────────────
const HelixCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    const bases = ["A", "T", "G", "C"];
    const COLS = Math.ceil(canvas.width / 120) + 1;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame * 0.012;

      for (let col = 0; col < COLS; col++) {
        const x = col * 120 + 40;
        const STEPS = 18;
        for (let s = 0; s < STEPS; s++) {
          const progress = s / STEPS;
          const y = progress * canvas.height;
          const phase = t + col * 1.3 + s * 0.35;
          const y1 = y + Math.sin(phase) * 22;
          const y2 = y + Math.sin(phase + Math.PI) * 22;
          const x1 = x + Math.cos(phase) * 14;
          const x2 = x - Math.cos(phase) * 14;

          // Backbone strand 1
          if (s < STEPS - 1) {
            const ny = (progress + 1 / STEPS) * canvas.height;
            const np = t + col * 1.3 + (s + 1) * 0.35;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x + Math.cos(np) * 14, ny + Math.sin(np) * 22);
            ctx.strokeStyle = "rgba(251,146,60,0.13)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x - Math.cos(np) * 14, ny + Math.sin(np + Math.PI) * 22);
            ctx.strokeStyle = "rgba(239,68,68,0.10)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Rungs
          const alpha = 0.06 + 0.04 * Math.abs(Math.cos(phase));
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(251,146,60,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Base letters
          if (s % 3 === 0) {
            const base = bases[(col * 4 + s) % 4];
            ctx.font = "bold 9px 'JetBrains Mono', monospace";
            ctx.fillStyle = `rgba(251,146,60,${alpha * 2})`;
            ctx.fillText(base, (x1 + x2) / 2 - 4, (y1 + y2) / 2 + 3);
          }
        }
      }
      frame++;
      requestAnimationFrame(draw);
    };
    draw();
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

// ─── Glowing score badge ──────────────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number }) => {
  const color = score > 0 ? "#22c55e" : score === 0 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32">
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ background: color }}
      />
      <div
        className="relative w-full h-full rounded-full border-2 flex flex-col items-center justify-center"
        style={{ borderColor: color, boxShadow: `0 0 24px ${color}55` }}
      >
        <span className="text-3xl font-black" style={{ color }}>
          {score > 0 ? `+${score}` : score}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">
          Score
        </span>
      </div>
    </div>
  );
};

// ─── Circular quality ring ────────────────────────────────────────────────────
const QualityRing = ({
  seq1Aligned,
  seq2Aligned,
}: {
  seq1Aligned: string;
  seq2Aligned: string;
}) => {
  let matches = 0,
    mismatches = 0,
    gaps = 0;
  for (let i = 0; i < seq1Aligned.length; i++) {
    if (seq1Aligned[i] === "-" || seq2Aligned[i] === "-") gaps++;
    else if (seq1Aligned[i] === seq2Aligned[i]) matches++;
    else mismatches++;
  }
  const total = seq1Aligned.length;
  const pct = Math.round((matches / total) * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const matchArc = (matches / total) * circ;
  const mismatchArc = (mismatches / total) * circ;
  const gapArc = (gaps / total) * circ;

  const segments = [
    { len: matchArc, color: "#22c55e", offset: 0 },
    { len: mismatchArc, color: "#f59e0b", offset: matchArc },
    { len: gapArc, color: "#ef4444", offset: matchArc + mismatchArc },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${seg.len} ${circ - seg.len}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">
            {pct}
            <span className="text-lg text-gray-400">%</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Identity
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center w-full">
        {[
          { label: "Matches", count: matches, color: "#22c55e", icon: "✓" },
          { label: "Mismatch", count: mismatches, color: "#f59e0b", icon: "≠" },
          { label: "Gaps", count: gaps, color: "#ef4444", icon: "—" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-2.5 border"
            style={{ borderColor: s.color + "44", background: s.color + "11" }}
          >
            <div className="text-lg font-black" style={{ color: s.color }}>
              {s.count}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Sequence visualizer ──────────────────────────────────────────────────────
const SeqVisualizer = ({
  seq1Aligned,
  seq2Aligned,
}: {
  seq1Aligned: string;
  seq2Aligned: string;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const getCellStyle = (c1: string, c2: string) => {
    if (c1 === "-" || c2 === "-")
      return { bg: "#7f1d1d", border: "#ef4444", glow: "#ef444455" };
    if (c1 === c2)
      return { bg: "#14532d", border: "#22c55e", glow: "#22c55e55" };
    return { bg: "#78350f", border: "#f59e0b", glow: "#f59e0b55" };
  };

  const CONNECTOR_MAP: Record<string, string> = {
    match: "|",
    mismatch: "·",
    gap: " ",
  };

  return (
    <div className="space-y-1">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold w-6">
          S1
        </span>
        <div className="flex flex-wrap gap-1">
          {seq1Aligned.split("").map((char, i) => {
            const style = getCellStyle(char, seq2Aligned[i]);
            const isH = hovered === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm rounded-md cursor-pointer transition-all duration-150 select-none"
                style={{
                  background: style.bg,
                  border: `1.5px solid ${isH ? style.border : style.border + "88"}`,
                  boxShadow: isH ? `0 0 14px ${style.glow}` : "none",
                  transform: isH ? "translateY(-3px) scale(1.18)" : "none",
                  color: "#fff",
                  zIndex: isH ? 10 : 1,
                  position: "relative",
                }}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connectors */}
      <div className="flex items-center gap-2">
        <span className="w-6" />
        <div className="flex flex-wrap gap-1">
          {seq1Aligned.split("").map((c1, i) => {
            const c2 = seq2Aligned[i];
            const type =
              c1 === "-" || c2 === "-"
                ? "gap"
                : c1 === c2
                  ? "match"
                  : "mismatch";
            return (
              <div
                key={i}
                className="w-8 h-4 flex items-center justify-center font-mono text-sm"
                style={{
                  color:
                    type === "match"
                      ? "#22c55e"
                      : type === "mismatch"
                        ? "#f59e0b"
                        : "#ef4444",
                  opacity: hovered === i ? 1 : 0.5,
                }}
              >
                {CONNECTOR_MAP[type]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Seq2 row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold w-6">
          S2
        </span>
        <div className="flex flex-wrap gap-1">
          {seq2Aligned.split("").map((char, i) => {
            const style = getCellStyle(seq1Aligned[i], char);
            const isH = hovered === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm rounded-md cursor-pointer transition-all duration-150 select-none"
                style={{
                  background: style.bg,
                  border: `1.5px solid ${isH ? style.border : style.border + "88"}`,
                  boxShadow: isH ? `0 0 14px ${style.glow}` : "none",
                  transform: isH ? "translateY(3px) scale(1.18)" : "none",
                  color: "#fff",
                  zIndex: isH ? 10 : 1,
                  position: "relative",
                }}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 pt-3">
        {[
          { color: "#22c55e", label: "Match" },
          { color: "#f59e0b", label: "Mismatch" },
          { color: "#ef4444", label: "Gap" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }}
            />
            <span className="text-xs text-gray-400 font-semibold">
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DP matrix viewer ─────────────────────────────────────────────────────────
const MatrixView = ({
  matrix,
  seq1,
  seq2,
  traceback,
}: {
  matrix: number[][];
  seq1: string;
  seq2: string;
  traceback: { row: number; col: number }[];
}) => {
  const isPath = (r: number, c: number) =>
    traceback.some((p) => p.row === r && p.col === c);

  const allVals = matrix.flat();
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);

  const heatColor = (v: number): string => {
    const t = (v - minVal) / (maxVal - minVal || 1);
    const r = Math.round(15 + t * 30);
    const g = Math.round(41 + t * 60);
    const b = Math.round(66 + t * 20);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="overflow-auto max-h-80">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-gray-500 font-bold border border-slate-700/50 bg-slate-900/80 sticky top-0 z-10" />
            <th className="px-2 py-1.5 text-gray-500 font-bold border border-slate-700/50 bg-slate-900/80 sticky top-0 z-10">
              —
            </th>
            {seq2.split("").map((c, j) => (
              <th
                key={j}
                className="px-2 py-1.5 border border-slate-700/50 bg-slate-900/80 sticky top-0 z-10"
              >
                <span className="font-black text-orange-400">{c}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="px-2 py-1.5 border border-slate-700/50 bg-slate-900/80 font-black text-orange-400 text-center sticky left-0 z-10">
                {i === 0 ? "—" : seq1[i - 1]}
              </td>
              {row.map((val, j) => {
                const path = isPath(i, j);
                return (
                  <td
                    key={j}
                    className="px-2 py-1.5 text-center border font-mono font-bold transition-all"
                    style={{
                      background: path
                        ? "linear-gradient(135deg,#ea580c,#dc2626)"
                        : heatColor(val),
                      borderColor: path ? "#f97316" : "#1e293b",
                      color: path ? "#fff" : val >= 0 ? "#86efac" : "#fca5a5",
                      boxShadow: path ? "0 0 10px #f9731688" : "none",
                    }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Slider input ─────────────────────────────────────────────────────────────
const SliderInput = ({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs uppercase tracking-widest font-bold text-gray-400">
        {label}
      </label>
      <span className="font-black text-sm w-8 text-right" style={{ color }}>
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
    <input
      type="range"
      min={-5}
      max={5}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${((value + 5) / 10) * 100}%, #334155 ${((value + 5) / 10) * 100}%, #334155 100%)`,
        accentColor: color,
      }}
    />
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [seq1, setSeq1] = useState("ATGCGTAC");
  const [seq2, setSeq2] = useState("AGGTCATC");
  const [scoring, setScoring] = useState<ScoringSystem>({
    match: 2,
    mismatch: -1,
    gap: -2,
  });
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "matrix">("visual");

  const isValidDNA = (s: string) => /^[ATGC]*$/.test(s.toUpperCase());
  const seq1Valid = isValidDNA(seq1);
  const seq2Valid = isValidDNA(seq2);
  const canAlign = seq1.length > 0 && seq2.length > 0 && seq1Valid && seq2Valid;

  const handleAlign = () => {
    setRunning(true);
    setTimeout(() => {
      const r = needlemanWunsch(
        seq1.toUpperCase(),
        seq2.toUpperCase(),
        scoring,
      );
      setResult(r);
      setRunning(false);
    }, 60);
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: "#040c14",
        fontFamily: "'Space Mono', 'JetBrains Mono', monospace",
      }}
    >
      <HelixCanvas />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(251,146,60,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(251,146,60,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* ── Header ── */}
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 mb-4">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">
              Bioinformatics Tool
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-3">
            <span className="text-white">DNA</span>
            <span
              style={{
                background: "linear-gradient(90deg,#f97316,#ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {" "}
              Alignment
            </span>
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase font-bold">
            Hirschberg · O(MN) Time · O(min M,N) Space
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left panel ── */}
          <div className="lg:col-span-4 space-y-4">
            {/* Sequences */}
            <div
              className="rounded-2xl border border-slate-700/60 overflow-hidden"
              style={{
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="px-5 py-3 border-b border-slate-700/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Input Sequences
                </span>
              </div>
              <div className="p-5 space-y-4">
                {[
                  {
                    label: "Sequence A",
                    val: seq1,
                    set: setSeq1,
                    valid: seq1Valid,
                  },
                  {
                    label: "Sequence B",
                    val: seq2,
                    set: setSeq2,
                    valid: seq2Valid,
                  },
                ].map(({ label, val, set, valid }) => (
                  <div key={label}>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">
                      {label}
                    </label>
                    <textarea
                      value={val}
                      onChange={(e) =>
                        set(
                          e.target.value.toUpperCase().replace(/[^ATGC]/g, ""),
                        )
                      }
                      rows={2}
                      placeholder="A T G C …"
                      className="w-full px-3 py-2 rounded-xl font-mono text-sm font-black resize-none transition-all outline-none"
                      style={{
                        background: "#0f172a",
                        border: `1.5px solid ${val && !valid ? "#ef4444" : "#334155"}`,
                        color: "#f8fafc",
                        letterSpacing: "0.12em",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#f97316")}
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          val && !valid ? "#ef4444" : "#334155")
                      }
                    />
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {val.split("").map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-black px-1 py-0.5 rounded"
                          style={{
                            background:
                              {
                                A: "#166534",
                                T: "#1e3a5f",
                                G: "#78350f",
                                C: "#581c87",
                              }[c] || "#1e293b",
                            color: "#fff",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring */}
            <div
              className="rounded-2xl border border-slate-700/60 overflow-hidden"
              style={{
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="px-5 py-3 border-b border-slate-700/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Scoring Matrix
                </span>
              </div>
              <div className="p-5 space-y-5">
                <SliderInput
                  label="Match"
                  value={scoring.match}
                  onChange={(v) => setScoring({ ...scoring, match: v })}
                  color="#22c55e"
                />
                <SliderInput
                  label="Mismatch"
                  value={scoring.mismatch}
                  onChange={(v) => setScoring({ ...scoring, mismatch: v })}
                  color="#f59e0b"
                />
                <SliderInput
                  label="Gap Penalty"
                  value={scoring.gap}
                  onChange={(v) => setScoring({ ...scoring, gap: v })}
                  color="#ef4444"
                />
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleAlign}
              disabled={!canAlign || running}
              className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 relative overflow-hidden"
              style={{
                background: canAlign
                  ? "linear-gradient(135deg,#ea580c,#dc2626)"
                  : "#1e293b",
                color: canAlign ? "#fff" : "#475569",
                boxShadow: canAlign
                  ? "0 0 30px #f9731655,0 4px 20px #00000066"
                  : "none",
                cursor: canAlign ? "pointer" : "not-allowed",
              }}
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="60"
                      strokeDashoffset="20"
                    />
                  </svg>
                  Computing…
                </span>
              ) : (
                "⚡ Run Alignment"
              )}
            </button>

            {/* Complexity badge */}
            <div
              className="rounded-2xl border border-orange-500/20 p-4"
              style={{ background: "rgba(251,146,60,0.05)" }}
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Time", val: "O(M×N)" },
                  { label: "Space", val: "O(min)" },
                ].map((b) => (
                  <div key={b.label} className="text-center">
                    <div className="text-orange-400 font-black text-lg">
                      {b.val}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      {b.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-8 space-y-4">
            {result ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className="rounded-2xl border border-slate-700/60 p-4 flex flex-col items-center justify-center"
                    style={{
                      background: "rgba(15,23,42,0.85)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <ScoreBadge score={result.score} />
                  </div>
                  <div
                    className="col-span-2 rounded-2xl border border-slate-700/60 p-5 flex items-center justify-center"
                    style={{
                      background: "rgba(15,23,42,0.85)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <QualityRing
                      seq1Aligned={result.seq1Aligned}
                      seq2Aligned={result.seq2Aligned}
                    />
                  </div>
                </div>

                {/* Timing */}
                <div
                  className="rounded-xl border border-slate-700/40 px-5 py-3 flex items-center gap-4"
                  style={{ background: "rgba(15,23,42,0.6)" }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                    Execution
                  </span>
                  <span className="font-black text-green-400 text-lg ml-auto">
                    {result.executionTime.toFixed(4)}
                    <span className="text-gray-500 text-sm font-normal ml-1">
                      ms
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                    Performance Verified
                  </span>
                </div>

                {/* Tab panel */}
                <div
                  className="rounded-2xl border border-slate-700/60 overflow-hidden"
                  style={{
                    background: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex border-b border-slate-700/60">
                    {(["visual", "matrix"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="flex-1 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all"
                        style={{
                          background:
                            activeTab === tab
                              ? "rgba(249,115,22,0.12)"
                              : "transparent",
                          color: activeTab === tab ? "#f97316" : "#64748b",
                          borderBottom:
                            activeTab === tab
                              ? "2px solid #f97316"
                              : "2px solid transparent",
                        }}
                      >
                        {tab === "visual" ? "🧬 Sequence View" : "📊 DP Matrix"}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {activeTab === "visual" ? (
                      <SeqVisualizer
                        seq1Aligned={result.seq1Aligned}
                        seq2Aligned={result.seq2Aligned}
                      />
                    ) : (
                      <MatrixView
                        matrix={result.matrix}
                        seq1={seq1.toUpperCase()}
                        seq2={seq2.toUpperCase()}
                        traceback={result.traceback}
                      />
                    )}
                  </div>
                </div>

                {/* Aligned strings */}
                <div
                  className="rounded-2xl border border-slate-700/60 p-5 space-y-3"
                  style={{
                    background: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                    Raw Alignment Strings
                  </div>
                  {[result.seq1Aligned, result.seq2Aligned].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-orange-400 w-4">
                        S{i + 1}
                      </span>
                      <div
                        className="flex-1 px-3 py-2 rounded-lg font-mono text-sm font-black tracking-widest overflow-x-auto"
                        style={{
                          background: "#0f172a",
                          border: "1px solid #1e293b",
                          color: "#f8fafc",
                        }}
                      >
                        {s.split("").map((c, j) => (
                          <span
                            key={j}
                            style={{
                              color:
                                c === "-"
                                  ? "#ef4444"
                                  : s === result.seq1Aligned
                                    ? result.seq2Aligned[j] === c
                                      ? "#22c55e"
                                      : "#f59e0b"
                                    : result.seq1Aligned[j] === c
                                      ? "#22c55e"
                                      : "#f59e0b",
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="rounded-2xl border border-slate-700/40 flex flex-col items-center justify-center py-28 gap-5"
                style={{
                  background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="text-6xl opacity-30">🧬</div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                  Enter sequences and run alignment
                </p>
                <div className="text-[11px] text-gray-600 font-mono">
                  Hirschberg · Divide & Conquer · Linear Space
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:currentColor; cursor:pointer; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#0f172a; }
        ::-webkit-scrollbar-thumb { background:#334155; border-radius:9px; }
      `}</style>
    </div>
  );
}

export default App;
