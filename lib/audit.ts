import "server-only";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

// 기록 가능한 action 종류. 새 지점 추가 시 여기에 type 확장.
export type AuditAction =
    | "login.success"
    | "login.failure"
    | "admin.data.update"
    | "admin.data.delete"
    | "board.post.delete"
    | "board.post.update"
    | "secret.rotation"
    | "user.role.change";

interface LogAuditOptions {
    action: AuditAction;
    userEmail?: string | null;
    userId?: string | null;
    target?: string | null;
    metadata?: Record<string, unknown> | null;
    req?: NextRequest | Request | null;
}

/**
 * 보안·관리 이벤트를 audit_logs 테이블에 기록한다.
 *
 * - server-only (브라우저 번들 차단)
 * - service_role 사용 (RLS 우회)
 * - 실패는 운영 흐름을 막지 않는다 (try/catch + console.error)
 *
 * Usage:
 *   await logAudit({ action: 'login.success', userEmail, req });
 *   await logAudit({ action: 'admin.data.update', userEmail: guard.email, target: `year=${year}` });
 */
export async function logAudit(opts: LogAuditOptions): Promise<void> {
    try {
        const headers = opts.req?.headers;
        const ipAddress = headers?.get("x-forwarded-for") ?? headers?.get("x-real-ip") ?? null;
        const userAgent = headers?.get("user-agent") ?? null;

        const { error } = await supabaseAdmin.from("audit_logs").insert({
            user_id: opts.userId ?? null,
            user_email: opts.userEmail ?? null,
            action: opts.action,
            target: opts.target ?? null,
            metadata: opts.metadata ?? null,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        if (error) {
            console.error("[audit] insert failed:", opts.action, error.message);
        }
    } catch (err) {
        // 감사 로그 실패가 운영을 막으면 안 됨. 콘솔만 기록 후 swallow.
        console.error("[audit] unexpected error:", opts.action, err);
    }
}
