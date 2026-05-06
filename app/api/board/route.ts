import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { isAdmin, ADMIN_ONLY_CATEGORIES } from "@/lib/admin";

// GET: 게시글 목록 조회
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 15;
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const searchType = searchParams.get("searchType") || "title"; // title | author
    const category = searchParams.get("category") || "";

    // 현재 로그인한 사용자 확인 (비공개 글 필터링용)
    const session = await auth();
    const currentUserEmail = session?.user?.email || "";

    try {
        // 1. 상단 고정 글 (공지/Q&A) - 공개 글만
        const { data: pinnedPosts } = await supabase
            .from("board_posts")
            .select("*")
            .eq("is_pinned", true)
            .or(`is_public.eq.true,is_public.is.null`)
            .order("created_at", { ascending: false });

        // 2. 일반 글 (검색 + 페이지네이션)
        // 공개 글 + 본인의 비공개 글만 표시
        let query = supabase
            .from("board_posts")
            .select("*", { count: "exact" })
            .eq("is_pinned", false);

        if (currentUserEmail) {
            // 로그인 상태: 공개 글 + 본인 비공개 글
            query = query.or(`is_public.eq.true,is_public.is.null,author_email.eq.${currentUserEmail}`);
        } else {
            // 비로그인 상태: 공개 글만
            query = query.or(`is_public.eq.true,is_public.is.null`);
        }

        if (category) {
            query = query.eq("category", category);
        }

        if (search) {
            if (searchType === "author") {
                query = query.ilike("author_name", `%${search}%`);
            } else {
                query = query.ilike("title", `%${search}%`);
            }
        }

        const { data: posts, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        return NextResponse.json({
            success: true,
            data: {
                pinnedPosts: pinnedPosts || [],
                posts: posts || [],
                totalCount: count || 0,
                currentPage: page,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Board GET error:", error);
        return NextResponse.json(
            { success: false, error: "게시글 목록을 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }
}

// POST: 새 게시글 작성
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json(
            { success: false, error: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { title, content, category, is_public } = body;

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json(
                { success: false, error: "제목과 내용을 모두 입력해주세요." },
                { status: 400 }
            );
        }

        // 관리자 전용 카테고리 권한 체크
        if (ADMIN_ONLY_CATEGORIES.includes(category) && !isAdmin(session.user.email)) {
            return NextResponse.json(
                { success: false, error: "Q&A/공지 카테고리는 관리자만 작성할 수 있습니다." },
                { status: 403 }
            );
        }

        const { data, error } = await supabase
            .from("board_posts")
            .insert({
                title: title.trim(),
                content: content.trim(),
                category: category || "일반",
                author_name: session.user.name || "익명",
                author_email: session.user.email || "",
                is_pinned: category === "공지" || category === "Q&A",
                is_public: is_public !== false, // 기본값 true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Board POST error:", error);
        return NextResponse.json(
            { success: false, error: "게시글 작성에 실패했습니다." },
            { status: 500 }
        );
    }
}
