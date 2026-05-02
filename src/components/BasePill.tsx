import { BASE_COLORS } from "../constants";

export function BasePill({
  base,
  revealed = false,
  active = false,
  type,
}: {
  base: string;
  revealed?: boolean;
  active?: boolean;
  type?: "match" | "mismatch" | "gap";
}) {
  const col = BASE_COLORS[base];
  const revStyle =
    type === "match"
      ? { bg: "#E8F5E9", bd: "#4CAF50", tx: "#2E7D32" }
      : type === "mismatch"
        ? { bg: "#FFF3E0", bd: "#FF9800", tx: "#E65100" }
        : type === "gap"
          ? { bg: "#FFEBEE", bd: "#EF5350", tx: "#C62828" }
          : null;
  const s =
    revealed && revStyle
      ? revStyle
      : col
        ? { bg: col.pill, bd: col.dot, tx: col.text }
        : { bg: "#F5F5F5", bd: "#BDBDBD", tx: "#616161" };
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: s.bg,
        border: `1.5px solid ${revealed || active ? s.bd : "rgba(0,0,0,0.07)"}`,
        color: s.tx,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'DM Mono', monospace",
        opacity: revealed || active ? 1 : 0.3,
        transform: active
          ? "scale(1.2) translateY(-3px)"
          : revealed
            ? "scale(1)"
            : "scale(0.88)",
        transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: active
          ? `0 6px 16px ${s.bd}55`
          : revealed && type === "match"
            ? `0 2px 8px ${s.bd}33`
            : "none",
        flexShrink: 0,
      }}
    >
      {base === "-" ? "—" : base}
    </div>
  );
}
