import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/audit?page=1&action=login.success
//
// middleware.ts는 /admin/** 와 /api/admin-data/** 만 1차 차단한다.
// 본 라우트는 matcher 외부라 라우트 핸들러 자체에서 requireAdminSession() 가드.

const querySchema = z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
    action: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
    const guard = await requireAdminSession();
    if (guard.response) return guard.response;

    const sp = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
        page: sp.get("page") ?? undefined,
        pageSize: sp.get("pageSize") ?? undefined,
        action: sp.get("action") ?? undefined,
    });
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid query", issues: parsed.error.issues },
            { status: 400 }
        );
    }
    const { page, pageSize, action } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from("audit_logs")
        .select("id, user_email, action, target, metadata, ip_address, user_agent, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (action) {
        query = query.eq("action", action);
    }

    const { data, count, error } = await query;
    if (error) {
        console.error("[admin/audit] supabase error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const totalCount = count ?? 0;
    return NextResponse.json({
        data: data ?? [],
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    });
}
