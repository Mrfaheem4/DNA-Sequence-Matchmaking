import { FloatingCard } from "./FloatingCard";

export function EmptyState() {
  return (
    <FloatingCard
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 220,
        gap: 12,
        opacity: 0.6,
      }}
    >
      <div style={{ fontSize: 44, opacity: 0.25 }}>⬡</div>
      <p
        style={{
          fontSize: 12,
          color: "#9E9E9E",
          textAlign: "center",
          fontWeight: 500,
          lineHeight: 1.7,
        }}
      >
        Enter sequences &amp; run alignment
        <br />
        to watch bases pair in real time
      </p>
      <div
        style={{
          fontSize: 10,
          color: "#BDBDBD",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        Needleman–Wunsch · Global · DP
      </div>
    </FloatingCard>
  );
}
