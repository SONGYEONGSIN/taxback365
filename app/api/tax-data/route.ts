import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// JSONB 컬럼이라 data 자체는 임의 객체. 단지 존재·크기 상한만 검증.
const taxDataSchema = z.object({
    data: z.record(z.string(), z.unknown()),
});

// GET /api/tax-data
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;

        const { data, error } = await supabase
            .from("tax_data")
            .select("data")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ data: data?.data || null });
    } catch (error) {
        console.error("Tax data GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/tax-data
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;

        let raw: unknown;
        try {
            raw = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = taxDataSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", issues: parsed.error.issues },
                { status: 400 }
            );
        }
        const { data } = parsed.data;

        const { error } = await supabase
            .from("tax_data")
            .upsert(
                {
                    user_id: userId,
                    data: data,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Tax data POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
