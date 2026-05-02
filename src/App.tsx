import { useState, useRef, useCallback } from "react";
import "./App.css";
import { HelixSVG } from "./components/HelixSVG";
import { FloatingCard } from "./components/FloatingCard";
import { BasePill } from "./components/BasePill";
import { ScoreRing } from "./components/ScoreRing";
import { DPMatrix } from "./components/DPMatrix";
import { EmptyState } from "./components/EmptyState";
import type { ScoringSystem, AlignmentResult, Phase } from "./constants";
import { BASE_COLORS, sleep } from "./constants";
import { needlemanWunsch } from "./utils/needlemanWunsch";

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [seq1Input, setSeq1Input] = useState("ATGCGTAC");
  const [seq2Input, setSeq2Input] = useState("AGGTCATC");
  const [scoring, setScoring] = useState<ScoringSystem>({
    match: 2,
    mismatch: -1,
    gap: -2,
  });
  const [speed, setSpeed] = useState(3);

  const [phase, setPhase] = useState<Phase>("idle");
  const [scanIdx, setScanIdx] = useState(0);
  const [revealedPairs, setRevealedPairs] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [liveSeq1, setLiveSeq1] = useState("");
  const [liveSeq2, setLiveSeq2] = useState("");
  const [matrixCells, setMatrixCells] = useState<
    { val: number | null; active: boolean; onPath: boolean }[][]
  >([]);
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  const animRef = useRef(false);

  const getDelay = useCallback(
    () => [320, 180, 80, 35, 10][speed - 1],
    [speed],
  );

  const handleRun = useCallback(async () => {
    if (animRef.current) return;
    const s1 = seq1Input.toUpperCase().replace(/[^ATGC]/g, "");
    const s2 = seq2Input.toUpperCase().replace(/[^ATGC]/g, "");
    if (!s1 || !s2) return;

    animRef.current = true;
    setResult(null);
    setRevealedCount(0);
    setRevealedPairs(0);
    setScanIdx(0);
    setLiveSeq1(s1);
    setLiveSeq2(s2);
    setMatrixCells([]);
    setShowMatrix(false);

    const ms = needlemanWunsch(s1, s2, scoring);
    setResult(ms);

    // Phase: scan
    setPhase("scanning");
    const maxScan = Math.max(s1.length, s2.length);
    for (let i = 0; i <= maxScan; i++) {
      setScanIdx(i);
      await sleep(getDelay() * 1.1);
    }

    // Phase: fill DP
    setPhase("filling");
    const m = s1.length,
      n = s2.length;
    const blank = Array.from({ length: m + 1 }, () =>
      Array.from({ length: n + 1 }, () => ({
        val: null as number | null,
        active: false,
        onPath: false,
      })),
    );
    setMatrixCells(blank);
    for (let i = 0; i <= m; i++) {
      setMatrixCells((prev) => {
        const nx = prev.map((r) => r.map((c) => ({ ...c, active: false })));
        nx[i][0] = { val: ms.matrix[i][0], active: true, onPath: false };
        return nx;
      });
      setActiveCell([i, 0]);
      await sleep(getDelay() * 0.55);
    }
    for (let j = 1; j <= n; j++) {
      setMatrixCells((prev) => {
        const nx = prev.map((r) => r.map((c) => ({ ...c, active: false })));
        nx[0][j] = { val: ms.matrix[0][j], active: true, onPath: false };
        return nx;
      });
      setActiveCell([0, j]);
      await sleep(getDelay() * 0.55);
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        setMatrixCells((prev) => {
          const nx = prev.map((r) => r.map((c) => ({ ...c, active: false })));
          nx[i][j] = { val: ms.matrix[i][j], active: true, onPath: false };
          return nx;
        });
        setActiveCell([i, j]);
        await sleep(getDelay() * 0.45);
      }
    }

    // Phase: traceback
    setPhase("traceback");
    setActiveCell(null);
    const pathSet = new Set(ms.traceback.map((p) => `${p.row},${p.col}`));
    setMatrixCells((prev) =>
      prev.map((row, i) =>
        row.map((cell, j) => ({
          ...cell,
          active: false,
          onPath: pathSet.has(`${i},${j}`),
        })),
      ),
    );
    await sleep(getDelay() * 5);

    // Phase: reveal
    setPhase("revealing");
    const len = ms.seq1Aligned.length;
    for (let i = 0; i <= len; i++) {
      setRevealedCount(i);
      setRevealedPairs(Math.min(Math.floor((i * 13) / len), 13));
      await sleep(getDelay() * 1.3);
    }

    setPhase("done");
    animRef.current = false;
  }, [seq1Input, seq2Input, scoring, getDelay]);

  // Stats
  let matches = 0,
    mismatches = 0,
    gaps = 0;
  if (result) {
    for (let i = 0; i < result.seq1Aligned.length; i++) {
      const c1 = result.seq1Aligned[i],
        c2 = result.seq2Aligned[i];
      if (c1 === "-" || c2 === "-") gaps++;
      else if (c1 === c2) matches++;
      else mismatches++;
    }
  }
  const total = result?.seq1Aligned.length || 1;
  const identityPct = result ? Math.round((matches / total) * 100) : 0;

  const phaseMsg: Record<Phase, string> = {
    idle: "Ready to align",
    scanning: "Scanning sequences…",
    filling: "Building DP matrix…",
    traceback: "Tracing optimal path…",
    revealing: "Aligning bases…",
    done: "Alignment complete",
  };
  const isRunning = phase !== "idle" && phase !== "done";
  const canRun = seq1Input.length > 0 && seq2Input.length > 0 && !isRunning;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(150deg,#F5F7F2 0%,#EDF0E8 50%,#F2EFF5 100%)",
        fontFamily: "'DM Sans',sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:9px;background:#E0E8DC;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#4CAF50;cursor:pointer;box-shadow:0 2px 6px rgba(76,175,80,.35)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes matchPop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
      `}</style>

      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "28px 20px",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* ─── LEFT ─────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Branding */}
          <div style={{ padding: "4px 0 12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#4CAF50,#2E7D32)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 16, lineHeight: 1 }}>
                  ⬡
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#3A8A3C",
                }}
              >
                DNA · Align
              </span>
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#111",
                letterSpacing: "-0.025em",
              }}
            >
              Sequence
              <br />
              <span style={{ color: "#4CAF50" }}>Alignment</span>
              <span style={{ color: "#CDDC39", marginLeft: 2 }}>•</span>
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "#9E9E9E",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Global alignment with live base-by-base animation. Watch the DNA
              strand pair in real time.
            </p>
          </div>

          {/* Sequence inputs */}
          <FloatingCard>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#BDBDBD",
                marginBottom: 14,
              }}
            >
              Input Sequences
            </div>
            {[
              { label: "Sequence A", val: seq1Input, set: setSeq1Input },
              { label: "Sequence B", val: seq2Input, set: setSeq2Input },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#BDBDBD",
                    marginBottom: 7,
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </div>
                <input
                  value={val}
                  onChange={(e) =>
                    set(e.target.value.toUpperCase().replace(/[^ATGC]/g, ""))
                  }
                  placeholder="e.g. ATGCGTAC"
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: 11,
                    border: "1.5px solid #E4EDE0",
                    background: "#F9FCF8",
                    fontSize: 14,
                    fontFamily: "'DM Mono',monospace",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    color: "#111",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
                  onBlur={(e) => (e.target.style.borderColor = "#E4EDE0")}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    marginTop: 7,
                    flexWrap: "wrap",
                  }}
                >
                  {val.split("").map((c, i) => {
                    const col = BASE_COLORS[c];
                    return (
                      <span
                        key={i}
                        style={{
                          padding: "2px 7px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "'DM Mono',monospace",
                          background: col?.pill || "#F5F5F5",
                          color: col?.text || "#616161",
                          border: `1px solid ${col?.light || "#E0E0E0"}`,
                        }}
                      >
                        {c}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </FloatingCard>

          {/* Scoring */}
          <FloatingCard>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#BDBDBD",
                marginBottom: 14,
              }}
            >
              Scoring Parameters
            </div>
            {[
              {
                label: "Match",
                key: "match" as const,
                color: "#4CAF50",
                val: scoring.match,
              },
              {
                label: "Mismatch",
                key: "mismatch" as const,
                color: "#FF9800",
                val: scoring.mismatch,
              },
              {
                label: "Gap",
                key: "gap" as const,
                color: "#EF5350",
                val: scoring.gap,
              },
            ].map(({ label, key, color, val }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#9E9E9E",
                    width: 62,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  value={val}
                  onChange={(e) =>
                    setScoring((s) => ({
                      ...s,
                      [key]: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    flex: 1,
                    accentColor: color,
                    background: `linear-gradient(to right,${color}88,${color} ${((val + 5) / 10) * 100}%,#E0E8DC ${((val + 5) / 10) * 100}%)`,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono',monospace",
                    fontWeight: 700,
                    color,
                    width: 28,
                    textAlign: "right",
                  }}
                >
                  {val > 0 ? `+${val}` : val}
                </span>
              </div>
            ))}
          </FloatingCard>

          {/* Speed + Run */}
          <FloatingCard>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#BDBDBD",
                }}
              >
                Animation speed
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4CAF50" }}>
                {["Slow", "Medium", "Fast", "Faster", "Instant"][speed - 1]}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setSpeed(v)}
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 3,
                    border: "none",
                    cursor: "pointer",
                    background: v <= speed ? "#4CAF50" : "#E4EDE0",
                    transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                animRef.current = false;
                setPhase("idle");
                setTimeout(handleRun, 50);
              }}
              disabled={!canRun}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 14,
                background: canRun
                  ? "linear-gradient(135deg,#2E7D32,#4CAF50)"
                  : "#E8EDE4",
                color: canRun ? "#fff" : "#BDBDBD",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.04em",
                border: "none",
                cursor: canRun ? "pointer" : "not-allowed",
                boxShadow: canRun ? "0 6px 20px rgba(76,175,80,.32)" : "none",
                transition: "all 0.2s",
              }}
            >
              {isRunning ? phaseMsg[phase] : "▶  Run Alignment"}
            </button>
          </FloatingCard>

          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              paddingLeft: 2,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  phase === "done"
                    ? "#4CAF50"
                    : isRunning
                      ? "#2196F3"
                      : "#BDBDBD",
                animation: isRunning ? "pulse 1s infinite" : "none",
              }}
            />
            <span style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 500 }}>
              {phaseMsg[phase]}
            </span>
          </div>
        </div>

        {/* ─── RIGHT ────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ── Helix column ── */}
          <div style={{ position: "relative" }}>
            <HelixSVG
              phase={phase}
              revealedPairs={revealedPairs}
              seq1={liveSeq1}
              seq2={liveSeq2}
              scanIdx={scanIdx}
            />

            {/* Floating pill: Global Alignment */}
            <div
              style={{
                position: "absolute",
                top: 24,
                right: -30,
                animation: "fadeUp 0.5s ease 0.3s both",
              }}
            >
              <FloatingCard
                style={{
                  padding: "7px 14px",
                  borderRadius: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4CAF50",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#111",
                    whiteSpace: "nowrap",
                  }}
                >
                  Global Alignment
                </span>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#F0F7F0",
                    border: "1.5px solid #C8E6C9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#4CAF50",
                    fontWeight: 700,
                  }}
                >
                  +
                </div>
              </FloatingCard>
            </div>

            {/* Floating pill: O(MN) */}
            <div
              style={{
                position: "absolute",
                top: 195,
                right: -36,
                animation: "fadeUp 0.5s ease 0.6s both",
              }}
            >
              <FloatingCard
                style={{
                  padding: "7px 14px",
                  borderRadius: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2196F3",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>
                  O(M×N) time
                </span>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#E3F2FD",
                    border: "1.5px solid #BBDEFB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#2196F3",
                    fontWeight: 700,
                  }}
                >
                  +
                </div>
              </FloatingCard>
            </div>

            {/* Floating pill: Hirschberg */}
            <div
              style={{
                position: "absolute",
                top: 375,
                right: -26,
                animation: "fadeUp 0.5s ease 0.9s both",
              }}
            >
              <FloatingCard
                style={{
                  padding: "7px 14px",
                  borderRadius: 40,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#FF9800",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>
                  Hirschberg
                </span>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#FFF8E1",
                    border: "1.5px solid #FFECB3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#FF9800",
                    fontWeight: 700,
                  }}
                >
                  +
                </div>
              </FloatingCard>
            </div>

            {/* Live score badge at bottom of helix */}
            {result && (phase === "revealing" || phase === "done") && (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  animation: "fadeUp 0.4s ease",
                }}
              >
                <FloatingCard
                  style={{
                    padding: "8px 20px",
                    borderRadius: 40,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#9E9E9E", fontWeight: 500 }}
                  >
                    Score{" "}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 700,
                      color: result.score >= 0 ? "#2E7D32" : "#C62828",
                    }}
                  >
                    {result.score >= 0 ? `+${result.score}` : result.score}
                  </span>
                </FloatingCard>
              </div>
            )}
          </div>

          {/* ── Data column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* ── Score + quality (post-align) ── */}
            {(phase === "revealing" || phase === "done") && result ? (
              <>
                <FloatingCard style={{ animation: "fadeUp 0.4s ease" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 18 }}
                  >
                    <ScoreRing pct={identityPct} score={result.score} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#BDBDBD",
                          marginBottom: 3,
                        }}
                      >
                        Alignment Score
                      </div>
                      <div
                        style={{
                          fontSize: 40,
                          fontWeight: 700,
                          fontFamily: "'DM Mono',monospace",
                          color: result.score >= 0 ? "#2E7D32" : "#C62828",
                          letterSpacing: "-0.03em",
                          lineHeight: 1,
                        }}
                      >
                        {result.score >= 0 ? `+${result.score}` : result.score}
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                        {[
                          { l: "Match", v: matches, c: "#4CAF50" },
                          { l: "Mismatch", v: mismatches, c: "#FF9800" },
                          { l: "Gap", v: gaps, c: "#EF5350" },
                        ].map((s) => (
                          <div key={s.l}>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 700,
                                fontFamily: "'DM Mono',monospace",
                                color: s.c,
                              }}
                            >
                              {s.v}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: "#BDBDBD",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {s.l}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#BDBDBD",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 3,
                        }}
                      >
                        Time
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 700,
                          color: "#4CAF50",
                        }}
                      >
                        {result.executionTime.toFixed(2)}
                        <span
                          style={{
                            fontSize: 9,
                            color: "#9E9E9E",
                            marginLeft: 2,
                          }}
                        >
                          ms
                        </span>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                {/* ── Tabs for Alignment / Matrix View ── */}
                <FloatingCard
                  style={{
                    animation: "fadeUp 0.45s ease 0.05s both",
                    padding: 0,
                  }}
                >
                  <div style={{ borderBottom: "1px solid #F0F0F0" }}>
                    <div style={{ display: "flex", gap: 0 }}>
                      <button
                        onClick={() => setShowMatrix(false)}
                        style={{
                          flex: 1,
                          padding: "14px 16px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          color: !showMatrix ? "#2E7D32" : "#BDBDBD",
                          borderBottom: !showMatrix
                            ? "2px solid #4CAF50"
                            : "none",
                          transition: "all 0.2s",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Alignment
                      </button>
                      <button
                        onClick={() => setShowMatrix(true)}
                        style={{
                          flex: 1,
                          padding: "14px 16px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          color: showMatrix ? "#2E7D32" : "#BDBDBD",
                          borderBottom: showMatrix
                            ? "2px solid #4CAF50"
                            : "none",
                          transition: "all 0.2s",
                          letterSpacing: "0.05em",
                        }}
                      >
                        DP Matrix
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "16px 18px" }}>
                    {!showMatrix ? (
                      <>
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "#BDBDBD",
                            marginBottom: 14,
                          }}
                        >
                          Live Alignment
                        </div>

                        {/* S1 row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#BDBDBD",
                              width: 18,
                              textAlign: "right",
                              letterSpacing: "0.1em",
                              flexShrink: 0,
                            }}
                          >
                            S1
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            {result.seq1Aligned.split("").map((c, i) => {
                              const type =
                                c === "-" || result.seq2Aligned[i] === "-"
                                  ? "gap"
                                  : c === result.seq2Aligned[i]
                                    ? "match"
                                    : "mismatch";
                              return (
                                <BasePill
                                  key={i}
                                  base={c}
                                  revealed={i < revealedCount}
                                  active={i === revealedCount - 1}
                                  type={type}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Connectors */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 3,
                          }}
                        >
                          <span style={{ width: 18, flexShrink: 0 }} />
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            {result.seq1Aligned.split("").map((c1, i) => {
                              const c2 = result.seq2Aligned[i];
                              const type =
                                c1 === "-" || c2 === "-"
                                  ? "gap"
                                  : c1 === c2
                                    ? "match"
                                    : "mismatch";
                              return (
                                <div
                                  key={i}
                                  style={{
                                    width: 32,
                                    height: 11,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontFamily: "'DM Mono',monospace",
                                    color:
                                      type === "match"
                                        ? "#4CAF50"
                                        : type === "mismatch"
                                          ? "#FF9800"
                                          : "#EF5350",
                                    opacity: i < revealedCount ? 0.65 : 0,
                                    transition: "opacity 0.2s",
                                    flexShrink: 0,
                                  }}
                                >
                                  {type === "match"
                                    ? "│"
                                    : type === "mismatch"
                                      ? "╳"
                                      : " "}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* S2 row */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#BDBDBD",
                              width: 18,
                              textAlign: "right",
                              letterSpacing: "0.1em",
                              flexShrink: 0,
                            }}
                          >
                            S2
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              flexWrap: "wrap",
                            }}
                          >
                            {result.seq2Aligned.split("").map((c, i) => {
                              const type =
                                c === "-" || result.seq1Aligned[i] === "-"
                                  ? "gap"
                                  : c === result.seq1Aligned[i]
                                    ? "match"
                                    : "mismatch";
                              return (
                                <BasePill
                                  key={i}
                                  base={c}
                                  revealed={i < revealedCount}
                                  active={i === revealedCount - 1}
                                  type={type}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Legend */}
                        <div
                          style={{
                            display: "flex",
                            gap: 14,
                            paddingTop: 12,
                            borderTop: "1px solid #F0F0F0",
                          }}
                        >
                          {[
                            ["#4CAF50", "Match"],
                            ["#FF9800", "Mismatch"],
                            ["#EF5350", "Gap"],
                          ].map(([c, l]) => (
                            <div
                              key={l}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              <div
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 2,
                                  background: c,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#9E9E9E",
                                  fontWeight: 500,
                                }}
                              >
                                {l}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      matrixCells.length > 0 && (
                        <div
                          style={{
                            overflowX: "auto",
                            overflowY: "auto",
                            maxHeight: 340,
                          }}
                        >
                          <table
                            style={{
                              borderCollapse: "separate",
                              borderSpacing: "2px",
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 10,
                            }}
                          >
                            <thead>
                              <tr>
                                <td style={{ width: 24, height: 22 }} />
                                <td
                                  style={{
                                    width: 24,
                                    textAlign: "center",
                                    color: "#BDBDBD",
                                    fontWeight: 600,
                                    fontSize: 9,
                                  }}
                                >
                                  ∅
                                </td>
                                {liveSeq2.split("").map((c, j) => (
                                  <td
                                    key={j}
                                    style={{
                                      width: 24,
                                      textAlign: "center",
                                      fontWeight: 700,
                                      fontSize: 9,
                                      color: BASE_COLORS[c]?.text || "#616161",
                                    }}
                                  >
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {matrixCells.map((row, i) => (
                                <tr key={i}>
                                  <td
                                    style={{
                                      width: 24,
                                      textAlign: "center",
                                      fontWeight: 700,
                                      color:
                                        i === 0
                                          ? "#BDBDBD"
                                          : BASE_COLORS[liveSeq1[i - 1]]
                                              ?.text || "#616161",
                                      fontSize: 9,
                                    }}
                                  >
                                    {i === 0 ? "∅" : liveSeq1[i - 1]}
                                  </td>
                                  {row.map((cell, j) => {
                                    const isAct =
                                      activeCell?.[0] === i &&
                                      activeCell?.[1] === j;
                                    return (
                                      <td
                                        key={j}
                                        style={{
                                          width: 26,
                                          height: 22,
                                          textAlign: "center",
                                          borderRadius: 5,
                                          background: cell.onPath
                                            ? "rgba(76,175,80,0.13)"
                                            : isAct
                                              ? "rgba(33,150,243,0.15)"
                                              : cell.val !== null
                                                ? "#FAFCF9"
                                                : "transparent",
                                          border: `1px solid ${cell.onPath ? "rgba(76,175,80,0.35)" : isAct ? "rgba(33,150,243,0.35)" : "rgba(0,0,0,0.05)"}`,
                                          color: cell.onPath
                                            ? "#2E7D32"
                                            : isAct
                                              ? "#1565C0"
                                              : cell.val !== null
                                                ? cell.val >= 0
                                                  ? "#2E7D32"
                                                  : "#C62828"
                                                : "#E0E0E0",
                                          fontWeight:
                                            cell.onPath || isAct ? 700 : 500,
                                          fontSize: 9,
                                          transition: "all 0.1s",
                                        }}
                                      >
                                        {cell.val !== null
                                          ? cell.val >= 0
                                            ? `+${cell.val}`
                                            : cell.val
                                          : "·"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                </FloatingCard>
              </>
            ) : /* ── DP Matrix during animation ── */
            (phase === "filling" || phase === "traceback") &&
              matrixCells.length > 0 ? (
              <DPMatrix
                matrixCells={matrixCells}
                liveSeq1={liveSeq1}
                liveSeq2={liveSeq2}
                activeCell={activeCell}
                phase={phase}
              />
            ) : (
              <EmptyState />
            )}

            {/* Complexity chips */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Time",
                  val: "O(M×N)",
                  bg: "#F1F8E9",
                  bd: "#DCEDC8",
                  tx: "#33691E",
                },
                {
                  label: "Space",
                  val: "O(min)",
                  bg: "#E8F4FD",
                  bd: "#BBDEFB",
                  tx: "#1565C0",
                },
              ].map((b) => (
                <FloatingCard
                  key={b.label}
                  style={{
                    padding: "11px 14px",
                    background: b.bg,
                    border: `1px solid ${b.bd}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#9E9E9E",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 4,
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "'DM Mono',monospace",
                      color: b.tx,
                    }}
                  >
                    {b.val}
                  </div>
                </FloatingCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
