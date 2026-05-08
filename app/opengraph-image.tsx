import { ImageResponse } from "next/og";

export const alt = "taxback365 — 한국 직장인의 연말정산 환급";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#F7F8FA",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      {/* Hairline outer frame */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          border: "1px solid #DDE1E8",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 64,
        }}
      >
        {/* Top — eyebrow caption */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          taxback365
        </div>

        {/* Middle — ㅌ symbol + main copy */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* ㅌ symbol (160×160 inline svg via JSX) */}
          <svg width="160" height="160" viewBox="0 0 32 32" fill="none">
            <path
              d="M7 6 L25 6"
              stroke="#0F2547"
              strokeWidth={2.5}
              strokeLinecap="square"
            />
            <path
              d="M7 16 L25 16"
              stroke="#0F2547"
              strokeWidth={2.5}
              strokeLinecap="square"
            />
            <path
              d="M7 26 L25 26"
              stroke="#26C485"
              strokeWidth={2.5}
              strokeLinecap="square"
            />
            <path
              d="M16 6 L16 26"
              stroke="#0F2547"
              strokeWidth={2.5}
              strokeLinecap="square"
            />
          </svg>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color: "#0F2547",
                letterSpacing: "-0.025em",
                lineHeight: 1,
              }}
            >
              taxback365
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 500,
                color: "#3A4252",
                letterSpacing: "-0.01em",
              }}
            >
              한국 직장인의 연말정산 환급 SaaS
            </div>
          </div>
        </div>

        {/* Bottom — supporting line */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          기초자료 · 공제 시뮬레이션 · 절세 추천을 한 번에
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
