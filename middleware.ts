import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isAdmin } from "@/lib/admin";

// 미들웨어 전용 NextAuth 인스턴스 — edge runtime에서 동작.
// auth.ts의 무거운 callback(supabase upsert 등)은 사용하지 않는다.
const { auth } = NextAuth(authConfig);

// /admin/** 페이지 + /api/admin-data/** + /api/admin/** 라우트에 대해 NextAuth 세션 + 관리자 권한 검사.
// 비로그인은 /login 으로 리다이렉트(API는 401 JSON), 일반 사용자는 / 으로(API는 403).
export default auth((req) => {
    const session = req.auth;
    const path = req.nextUrl.pathname;
    const isApiRoute = path.startsWith("/api/");

    if (!session?.user?.email) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin(session.user.email)) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/admin/:path*", "/api/admin-data/:path*", "/api/admin/:path*"],
};
