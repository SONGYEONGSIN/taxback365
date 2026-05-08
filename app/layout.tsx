import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "taxback365 — 한국 직장인의 연말정산 환급",
    template: "%s | taxback365",
  },
  description:
    "한국 직장인을 위한 연말정산 환급 SaaS. 기초자료 입력, 공제 시뮬레이션, 절세 추천을 한 번에 정리합니다. 환급 가능 금액을 명확하게 확인하세요.",
  keywords: [
    "연말정산",
    "환급",
    "세금계산기",
    "절세",
    "소득공제",
    "세액공제",
    "2026",
    "연봉계산기",
    "taxback365",
  ],
  authors: [{ name: "taxback365" }],
  creator: "taxback365",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://taxback365.vercel.app",
  ),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "taxback365",
    title: "taxback365 — 한국 직장인의 연말정산 환급",
    description:
      "한국 직장인을 위한 연말정산 환급 SaaS. 기초자료 입력부터 공제 시뮬레이션, 절세 추천까지 한 번에.",
  },
  twitter: {
    card: "summary_large_image",
    title: "taxback365 — 한국 직장인의 연말정산 환급",
    description:
      "한국 직장인을 위한 연말정산 환급 SaaS. 환급 가능 금액을 명확하게 확인하세요.",
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
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
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
        className={`${inter.variable} antialiased`}
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
