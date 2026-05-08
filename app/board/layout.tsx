import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게시판",
  description:
    "연말정산 관련 질문과 답변, Q&A, 공지사항을 확인하세요. taxback365 사용자들과 절세 정보를 자유롭게 나눠보세요.",
  openGraph: {
    title: "게시판 | taxback365",
    description: "연말정산 관련 질문과 답변, Q&A, 공지사항을 확인하세요.",
  },
};

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
