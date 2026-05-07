import { ImageResponse } from "next/og";

// Node.js runtime 사용 (이전 `runtime = "edge"`는 정적 생성을 비활성화하는 빌드 경고 원인이었음).
// OG 이미지는 정적 컨텐츠라 edge runtime 이점이 없고, 정적 생성으로 두는 게 캐싱·성능 이득.

export const alt = "TAXAI - 2026 AI 연말정산 솔루션";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F5F0EB",
                    position: "relative",
                    fontFamily: "sans-serif",
                }}
            >
                {/* Border frame */}
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        left: 20,
                        right: 20,
                        bottom: 20,
                        border: "6px solid #000",
                        display: "flex",
                    }}
                />

                {/* Decorative accent - top left */}
                <div
                    style={{
                        position: "absolute",
                        top: 40,
                        left: 40,
                        width: 80,
                        height: 80,
                        backgroundColor: "#00D9FF",
                        border: "4px solid #000",
                        display: "flex",
                    }}
                />

                {/* Decorative accent - bottom right */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 40,
                        right: 40,
                        width: 100,
                        height: 100,
                        backgroundColor: "#FFB800",
                        border: "4px solid #000",
                        display: "flex",
                    }}
                />

                {/* Main content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 20,
                    }}
                >
                    <div
                        style={{
                            fontSize: 80,
                            fontWeight: 900,
                            color: "#000",
                            letterSpacing: "-0.05em",
                            display: "flex",
                        }}
                    >
                        TAXAI
                    </div>

                    <div
                        style={{
                            display: "flex",
                            backgroundColor: "#FF6B35",
                            color: "#fff",
                            fontSize: 32,
                            fontWeight: 800,
                            padding: "12px 40px",
                            border: "4px solid #000",
                            boxShadow: "8px 8px 0px 0px #000",
                        }}
                    >
                        2026 AI 연말정산 솔루션
                    </div>

                    <div
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#6B7280",
                            marginTop: 10,
                            display: "flex",
                        }}
                    >
                        AI가 분석하는 맞춤형 연말정산 · 최대 환급액 찾기
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
