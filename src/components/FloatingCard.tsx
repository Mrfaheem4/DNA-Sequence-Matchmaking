import React from "react";

export function FloatingCard({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px)",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        border: "1px solid rgba(255,255,255,0.85)",
        padding: "16px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
