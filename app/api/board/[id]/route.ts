import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { auth } from "@/auth";

// GET: 게시글 상세 조회 + 조회수 증가
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();
    const currentUserEmail = session?.user?.email || "";

    try {
        // 게시글 조회
        const { data, error } = await supabase
            .from("board_posts")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: "게시글을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 비공개 글은 작성자 본인만 조회 가능
        if (data.is_public === false && data.author_email !== currentUserEmail) {
            return NextResponse.json(
                { success: false, error: "비공개 게시글입니다." },
                { status: 403 }
            );
        }

        // 조회수 증가
        await supabase
            .from("board_posts")
            .update({ views: (data.views || 0) + 1 })
            .eq("id", id);

        return NextResponse.json({ success: true, data: { ...data, views: (data.views || 0) + 1 } });
    } catch (error) {
        console.error("Board GET detail error:", error);
        return NextResponse.json(
            { success: false, error: "게시글을 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }
}

// PATCH: 게시글 수정 (작성자 본인만)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { success: false, error: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    try {
        // 작성자 확인
        const { data: post } = await supabase
            .from("board_posts")
            .select("author_email")
            .eq("id", id)
            .single();

        if (!post) {
            return NextResponse.json(
                { success: false, error: "게시글을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 본인 글만 수정 가능
        if (post.author_email !== session.user.email) {
            return NextResponse.json(
                { success: false, error: "본인이 작성한 글만 수정할 수 있습니다." },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, content, category, is_public } = body;

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json(
                { success: false, error: "제목과 내용을 모두 입력해주세요." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("board_posts")
            .update({
                title: title.trim(),
                content: content.trim(),
                category: category || "일반",
                is_public: is_public !== false,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Board PATCH error:", error);
        return NextResponse.json(
            { success: false, error: "게시글 수정에 실패했습니다." },
            { status: 500 }
        );
    }
}

// DELETE: 게시글 삭제 (작성자 본인만)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { success: false, error: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    try {
        // 작성자 확인
        const { data: post } = await supabase
            .from("board_posts")
            .select("author_email")
            .eq("id", id)
            .single();

        if (!post) {
            return NextResponse.json(
                { success: false, error: "게시글을 찾을 수 없습니다." },
                { status: 404 }
            );
        }

        // 본인 글만 삭제 가능
        if (post.author_email !== session.user.email) {
            return NextResponse.json(
                { success: false, error: "본인이 작성한 글만 삭제할 수 있습니다." },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from("board_posts")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Board DELETE error:", error);
        return NextResponse.json(
            { success: false, error: "게시글 삭제에 실패했습니다." },
            { status: 500 }
        );
    }
}
