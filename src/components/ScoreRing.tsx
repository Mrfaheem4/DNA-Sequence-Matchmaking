export function ScoreRing({ pct, score }: { pct: number; score: number }) {
  const r = 38,
    circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  const color = score >= 0 ? "#4CAF50" : "#EF5350";
  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#F0F4EE"
          strokeWidth="7"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#1A1A1A",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            fontSize: 8,
            color: "#9E9E9E",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          match
        </span>
      </div>
    </div>
  );
}
