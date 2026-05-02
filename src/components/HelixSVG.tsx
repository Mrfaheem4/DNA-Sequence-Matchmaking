import { useState, useEffect, useRef } from "react";
import type { Phase } from "../constants";
import { BASE_COLORS } from "../constants";

export function HelixSVG({
  phase,
  revealedPairs,
  seq1,
  seq2,
  scanIdx,
}: {
  phase: Phase;
  revealedPairs: number;
  seq1: string;
  seq2: string;
  scanIdx: number;
}) {
  const tickRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let id: number;
    const loop = () => {
      tickRef.current++;
      forceUpdate((t) => t + 1);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const t = tickRef.current * 0.02;
  const RUNGS = 13;
  const helixH = 500;
  const cx = 150;
  const amp = 55;

  const rungs = Array.from({ length: RUNGS }, (_, i) => {
    const progress = i / (RUNGS - 1);
    const y = 50 + progress * helixH;
    const phi = t + i * ((Math.PI * 2) / RUNGS);
    const x1 = cx + Math.cos(phi) * amp;
    const x2 = cx - Math.cos(phi) * amp;
    const depth = Math.sin(phi);
    const isRevealed = i < revealedPairs;
    const isCurrent =
      i === revealedPairs && (phase === "revealing" || phase === "scanning");
    const c1 = seq1?.[i] ? BASE_COLORS[seq1[i]] : null;
    const c2 = seq2?.[i] ? BASE_COLORS[seq2[i]] : null;
    const isMatch = seq1?.[i] && seq2?.[i] && seq1[i] === seq2[i];
    return {
      y,
      x1,
      x2,
      depth,
      isRevealed,
      isCurrent,
      c1,
      c2,
      isMatch,
      base1: seq1?.[i],
      base2: seq2?.[i],
    };
  });

  const sortedRungs = [...rungs].sort((a, b) => a.depth - b.depth);

  return (
    <svg
      width="300"
      height="600"
      viewBox="0 0 300 600"
      style={{ overflow: "visible" }}
    >
      <defs>
        <filter id="softglow">
          <feGaussianBlur stdDeviation="2.5" result="cb" />
          <feMerge>
            <feMergeNode in="cb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="activeglow">
          <feGaussianBlur stdDeviation="4" result="cb" />
          <feMerge>
            <feMergeNode in="cb" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Backbone strand 1 */}
      {Array.from({ length: RUNGS - 1 }, (_, i) => {
        const r1 = rungs[i],
          r2 = rungs[i + 1];
        const revealed = r1.isRevealed;
        return (
          <g key={`bb1-${i}`}>
            <line
              x1={r1.x1}
              y1={r1.y}
              x2={r2.x1}
              y2={r2.y}
              stroke={revealed ? "#5FAD60" : "#C8DCC4"}
              strokeWidth={revealed ? 4 : 3}
              strokeLinecap="round"
              style={{ transition: "stroke 0.5s, stroke-width 0.3s" }}
            />
            <line
              x1={r1.x2}
              y1={r1.y}
              x2={r2.x2}
              y2={r2.y}
              stroke={revealed ? "#4A9B4B" : "#B8CEB4"}
              strokeWidth={revealed ? 4 : 3}
              strokeLinecap="round"
              style={{ transition: "stroke 0.5s" }}
            />
          </g>
        );
      })}

      {/* Rungs + nodes (depth-sorted) */}
      {sortedRungs.map((rung) => {
        const i = rungs.indexOf(rung);
        const rungAlpha = 0.35 + 0.45 * Math.abs(rung.depth);
        const matchColor = rung.isMatch ? "#4CAF50" : "#FF9800";
        const rungStroke = rung.isRevealed
          ? matchColor
          : rung.isCurrent
            ? "#2196F3"
            : "#B8CEB4";

        return (
          <g
            key={`rung-${i}`}
            style={{ filter: rung.isCurrent ? "url(#activeglow)" : undefined }}
          >
            {/* Rung crossbar */}
            <line
              x1={rung.x1}
              y1={rung.y}
              x2={rung.x2}
              y2={rung.y}
              stroke={rungStroke}
              strokeWidth={rung.isCurrent ? 2.5 : rung.isRevealed ? 2 : 1.5}
              strokeOpacity={rungAlpha}
              style={{ transition: "stroke 0.3s" }}
            />

            {/* Left node */}
            <circle
              cx={rung.x1}
              cy={rung.y}
              r={rung.isCurrent ? 9 : rung.isRevealed ? 8 : 5.5}
              fill={
                rung.c1
                  ? rung.isRevealed || rung.isCurrent
                    ? rung.c1.dot
                    : rung.c1.light
                  : rung.isRevealed
                    ? "#6BBF6A"
                    : "#C8DCC4"
              }
              stroke={rung.c1 ? rung.c1.dot : "#A8C5A4"}
              strokeWidth={rung.isRevealed ? 2.5 : rung.isCurrent ? 2.5 : 1}
              style={{
                transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                filter: rung.isRevealed ? "url(#softglow)" : undefined,
              }}
            />
            {(rung.isRevealed || rung.isCurrent) && rung.base1 && (
              <text
                x={rung.x1}
                y={rung.y + 4}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fontFamily="'DM Mono', monospace"
                fill="#fff"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {rung.base1}
              </text>
            )}

            {/* Right node */}
            <circle
              cx={rung.x2}
              cy={rung.y}
              r={rung.isCurrent ? 9 : rung.isRevealed ? 8 : 5.5}
              fill={
                rung.c2
                  ? rung.isRevealed || rung.isCurrent
                    ? rung.c2.dot
                    : rung.c2.light
                  : rung.isRevealed
                    ? "#5FAD60"
                    : "#B8CEB4"
              }
              stroke={rung.c2 ? rung.c2.dot : "#98B594"}
              strokeWidth={rung.isRevealed ? 2.5 : rung.isCurrent ? 2.5 : 1}
              style={{
                transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                filter: rung.isRevealed ? "url(#softglow)" : undefined,
              }}
            />
            {(rung.isRevealed || rung.isCurrent) && rung.base2 && (
              <text
                x={rung.x2}
                y={rung.y + 4}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fontFamily="'DM Mono', monospace"
                fill="#fff"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {rung.base2}
              </text>
            )}

            {/* Active rung scanner pulse */}
            {rung.isCurrent && (
              <>
                <circle
                  cx={rung.x1}
                  cy={rung.y}
                  r={14}
                  fill="none"
                  stroke="#2196F3"
                  strokeWidth="1.5"
                  strokeOpacity={0.4 + 0.35 * Math.sin(tickRef.current * 0.12)}
                />
                <circle
                  cx={rung.x2}
                  cy={rung.y}
                  r={14}
                  fill="none"
                  stroke="#2196F3"
                  strokeWidth="1.5"
                  strokeOpacity={
                    0.4 + 0.35 * Math.sin(tickRef.current * 0.12 + 0.5)
                  }
                />
              </>
            )}

            {/* Match celebration ring */}
            {rung.isRevealed && rung.isMatch && (
              <circle
                cx={cx}
                cy={rung.y}
                r={22}
                fill="none"
                stroke="#4CAF50"
                strokeWidth="0.8"
                strokeOpacity={0.12}
                strokeDasharray="3 5"
              />
            )}
          </g>
        );
      })}

      {/* Horizontal scan line */}
      {(phase === "scanning" || phase === "filling") && (
        <line
          x1={10}
          y1={rungs[Math.min(scanIdx, RUNGS - 1)]?.y ?? 0}
          x2={290}
          y2={rungs[Math.min(scanIdx, RUNGS - 1)]?.y ?? 0}
          stroke="#2196F3"
          strokeWidth="0.8"
          strokeDasharray="5 5"
          strokeOpacity={0.3 + 0.2 * Math.sin(tickRef.current * 0.08)}
        />
      )}
    </svg>
  );
}
