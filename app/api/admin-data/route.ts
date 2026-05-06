import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/admin-data?year=2026
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;
        const year = request.nextUrl.searchParams.get("year");

        if (!year) {
            return NextResponse.json({ error: "year parameter is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("admin_data")
            .select("data")
            .eq("user_id", userId)
            .eq("year", parseInt(year))
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
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.email;
        const body = await request.json();
        const { year, data } = body;

        if (!year || !data) {
            return NextResponse.json({ error: "year and data are required" }, { status: 400 });
        }

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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin data POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
