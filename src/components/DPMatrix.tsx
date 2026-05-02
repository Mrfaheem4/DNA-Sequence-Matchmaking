import { FloatingCard } from "./FloatingCard";
import { BASE_COLORS } from "../constants";

export function DPMatrix({
  matrixCells,
  liveSeq1,
  liveSeq2,
  activeCell,
  phase,
}: {
  matrixCells: { val: number | null; active: boolean; onPath: boolean }[][];
  liveSeq1: string;
  liveSeq2: string;
  activeCell: [number, number] | null;
  phase: "filling" | "traceback";
}) {
  return (
    <FloatingCard style={{ animation: "fadeUp 0.3s ease" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#BDBDBD",
          marginBottom: 10,
        }}
      >
        {phase === "filling" ? "DP Matrix — filling…" : "Traceback path"}
      </div>
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
                        : BASE_COLORS[liveSeq1[i - 1]]?.text || "#616161",
                    fontSize: 9,
                  }}
                >
                  {i === 0 ? "∅" : liveSeq1[i - 1]}
                </td>
                {row.map((cell, j) => {
                  const isAct = activeCell?.[0] === i && activeCell?.[1] === j;
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
                        fontWeight: cell.onPath || isAct ? 700 : 500,
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
    </FloatingCard>
  );
}
