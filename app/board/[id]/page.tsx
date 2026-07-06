"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Calendar,
  User,
  Trash2,
  Pin,
  Lock,
  Pencil,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface BoardPost {
  id: number;
  category: string;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  views: number;
  is_pinned: boolean;
  is_public: boolean;
  created_at: string;
}

const categoryVariant: Record<
  string,
  "danger" | "success" | "warning" | "neutral"
> = {
  공지: "danger",
  "Q&A": "success",
  질문: "warning",
  일반: "neutral",
};

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/board/${id}`);
        const data = await res.json();
        if (data.success) setPost(data.data);
      } catch (error) {
        console.error("Post fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/board/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/board");
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          <span className="text-body-sm text-mid">불러오는 중…</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 max-w-[760px] mx-auto">
        <p className="text-h2 text-hi">게시글을 찾을 수 없습니다</p>
        <Link href="/board">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} strokeWidth={1.75} />
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  const variant = categoryVariant[post.category] ?? "neutral";
  const isAuthor = session?.user?.email === post.author_email;
  const formattedDate = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-[760px] mx-auto">
      <Card padding="lg">
        {/* Category + Title */}
        <div className="flex items-start gap-2 mb-4 flex-wrap">
          {post.is_pinned && (
            <Pin
              size={18}
              className="text-mint mt-1 flex-shrink-0"
              strokeWidth={2}
            />
          )}
          <Badge variant={variant}>{post.category}</Badge>
          <h1 className="text-h1 text-hi break-words w-full">{post.title}</h1>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-mid border-b border-edge pb-4">
          <span className="inline-flex items-center gap-1.5">
            <User size={12} strokeWidth={1.75} />
            <span className="text-hi font-medium">{post.author_name}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Calendar size={12} strokeWidth={1.75} />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={12} strokeWidth={1.75} />
            조회 <span className="font-mono tabular-nums">{post.views}</span>
          </span>
          {post.is_public === false && (
            <span className="inline-flex items-center gap-1.5 text-amber">
              <Lock size={12} strokeWidth={1.75} />
              비공개
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mt-6 min-h-[200px] whitespace-pre-wrap text-body text-hi leading-[1.7]">
          {post.content}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/board">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} strokeWidth={1.75} />
            목록보기
          </Button>
        </Link>

        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link href={`/board/${id}/edit`}>
              <Button variant="secondary" size="md">
                <Pencil size={15} strokeWidth={1.75} />
                수정
              </Button>
            </Link>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              disabled={deleting}
              isLoading={deleting}
            >
              <Trash2 size={15} strokeWidth={1.75} />
              {deleting ? "삭제 중…" : "삭제"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
