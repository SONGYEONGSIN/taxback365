import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
    title: "기초자료 등록",
    description: "연말정산에 필요한 급여, 지출, 가족, 공제 데이터를 입력하고 관리하세요. 엑셀 업로드와 OCR 기능을 지원합니다.",
    robots: {
        index: false,  // 개인정보 페이지이므로 검색엔진 제외
    },
};

// middleware.ts가 /admin/** 진입을 1차 차단한다.
// 본 layout의 가드는 미들웨어 우회 시(matcher 누락 등)를 대비한 defense-in-depth.
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        redirect("/login?callbackUrl=/admin");
    }
    if (!isAdmin(session.user.email)) {
        redirect("/");
    }
    return children;
}
