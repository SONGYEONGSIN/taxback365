import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { WebApplicationJsonLd, FAQPageJsonLd } from "@/components/seo/JsonLd";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const lexend = Lexend({
    subsets: ["latin"],
    variable: "--font-lexend",
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "TAXAI - 2026 AI 연말정산 솔루션",
        template: "%s | TAXAI",
    },
    description: "AI가 분석하는 맞춤형 연말정산. 기초자료 입력부터 공제 시뮬레이션, 절세 추천까지 한 번에 해결하세요. 최대 환급액을 받아보세요.",
    keywords: ["연말정산", "세금계산기", "절세", "소득공제", "세액공제", "AI", "환급", "2026", "연봉계산기", "세금환급"],
    authors: [{ name: "TAXAI" }],
    creator: "TAXAI",
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://taxai.kr"),
    openGraph: {
        type: "website",
        locale: "ko_KR",
        siteName: "TAXAI",
        title: "TAXAI - 2026 AI 연말정산 솔루션",
        description: "AI가 분석하는 맞춤형 연말정산. 기초자료 입력부터 공제 시뮬레이션, 절세 추천까지 한 번에.",
    },
    twitter: {
        card: "summary_large_image",
        title: "TAXAI - 2026 AI 연말정산 솔루션",
        description: "AI가 분석하는 맞춤형 연말정산. 최대 환급액을 받아보세요.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "/",
    },
    verification: {
        // Google Search Console 등록 후 아래 값 교체
        // google: "your-google-verification-code",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body
                className={`${inter.variable} ${lexend.variable} antialiased`}
                suppressHydrationWarning
            >
                <AuthProvider>
                    <div className="min-h-screen pb-24 md:pb-0 flex flex-col">
                        <Navigation />
                        <main className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
                            {children}
                        </main>
                        <Footer />
                    </div>
                    <WebApplicationJsonLd />
                    <FAQPageJsonLd />
                </AuthProvider>
            </body>
        </html>
    );
}

