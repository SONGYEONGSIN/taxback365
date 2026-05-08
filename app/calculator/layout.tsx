import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "세금 계산기",
  description:
    "2026년 세법 개정안을 반영한 연말정산 세금 계산기. 소득공제, 세액공제를 입력하면 예상 환급액을 바로 확인할 수 있습니다.",
  openGraph: {
    title: "세금 계산기 | taxback365",
    description: "2026년 세법 개정안을 반영한 연말정산 세금 계산기.",
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
