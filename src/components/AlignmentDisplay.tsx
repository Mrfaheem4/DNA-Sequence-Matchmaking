import { FloatingCard } from "./FloatingCard";
import { ScoreRing } from "./ScoreRing";
import { BasePill } from "./BasePill";
import type { AlignmentResult } from "../constants";

export function AlignmentDisplay({
  result,
  revealedCount,
}: {
  result: AlignmentResult;
  revealedCount: number;
}) {
  // Stats
  let matches = 0,
    mismatches = 0,
    gaps = 0;
  for (let i = 0; i < result.seq1Aligned.length; i++) {
    const c1 = result.seq1Aligned[i],
      c2 = result.seq2Aligned[i];
    if (c1 === "-" || c2 === "-") gaps++;
    else if (c1 === c2) matches++;
    else mismatches++;
  }
  const total = result.seq1Aligned.length || 1;
  const identityPct = Math.round((matches / total) * 100);

  return (
    <>
      <FloatingCard style={{ animation: "fadeUp 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
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

      {/* ── Live alignment display ── */}
      <FloatingCard style={{ animation: "fadeUp 0.45s ease 0.05s both" }}>
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
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
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
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
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
                  {type === "match" ? "│" : type === "mismatch" ? "╳" : " "}
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
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
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
      </FloatingCard>
    </>
  );
}
