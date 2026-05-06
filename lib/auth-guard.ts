import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

// Server route 가드 결과.
// `response`가 있으면 그대로 return — 401/403 응답.
// `email`이 있으면 세션 + 관리자 검증 통과.
type AdminGuardResult =
    | { email: string; response?: never }
    | { email?: never; response: NextResponse };

/**
 * Server route 핸들러용: NextAuth 세션 + isAdmin 검사 동시 처리.
 *
 * Usage:
 *   const guard = await requireAdminSession();
 *   if (guard.response) return guard.response;
 *   // guard.email 사용
 */
export async function requireAdminSession(): Promise<AdminGuardResult> {
    const session = await auth();
    if (!session?.user?.email) {
        return {
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    if (!isAdmin(session.user.email)) {
        return {
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }
    return { email: session.user.email };
}
