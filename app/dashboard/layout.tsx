import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
  description:
    "AI가 분석한 맞춤형 절세 추천과 공제 현황을 한눈에 확인하세요. 예상 환급액과 최적화 전략을 제공합니다.",
  openGraph: {
    title: "대시보드 | taxback365",
    description:
      "AI가 분석한 맞춤형 절세 추천과 공제 현황을 한눈에 확인하세요.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
