import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth-guard";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const adminDataSchema = z.object({
    year: z.number().int().min(2020).max(2030),
    data: z.record(z.string(), z.unknown()),
});

const yearQuerySchema = z.coerce.number().int().min(2020).max(2030);

// GET /api/admin-data?year=2026
export async function GET(request: NextRequest) {
    try {
        // middleware.ts가 1차 차단하지만 defense-in-depth로 라우트 핸들러에도 가드.
        const guard = await requireAdminSession();
        if (guard.response) return guard.response;
        const userId = guard.email;
        const yearRaw = request.nextUrl.searchParams.get("year");
        const yearParsed = yearQuerySchema.safeParse(yearRaw);
        if (!yearParsed.success) {
            return NextResponse.json(
                { error: "year query is invalid (정수, 2020~2030)" },
                { status: 400 }
            );
        }
        const year = yearParsed.data;

        const { data, error } = await supabase
            .from("admin_data")
            .select("data")
            .eq("user_id", userId)
            .eq("year", year)
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows found (not an error)
            console.error("Supabase error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ data: data?.data || null });
    } catch (error) {
        console.error("Admin data GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin-data
export async function POST(request: NextRequest) {
    try {
        const guard = await requireAdminSession();
        if (guard.response) return guard.response;
        const userId = guard.email;

        let raw: unknown;
        try {
            raw = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = adminDataSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", issues: parsed.error.issues },
                { status: 400 }
            );
        }
        const { year, data } = parsed.data;

        const { error } = await supabase
            .from("admin_data")
            .upsert(
                {
                    user_id: userId,
                    year: year,
                    data: data,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,year" }
            );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        await logAudit({
            action: "admin.data.update",
            userEmail: userId,
            target: `year=${year}`,
            req: request,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin data POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
