"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Lock, Globe, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ysong2526@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

interface BoardPost {
  id: number;
  category: string;
  title: string;
  content: string;
  author_name: string;
  author_email: string;
  is_public: boolean;
}

export default function BoardEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const userIsAdmin = ADMIN_EMAILS.includes(
    session?.user?.email?.toLowerCase() || "",
  );
  const [category, setCategory] = useState("일반");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/board/${id}`);
        const data = await res.json();
        if (data.success) {
          const post: BoardPost = data.data;
          if (post.author_email !== session?.user?.email) {
            alert("본인이 작성한 글만 수정할 수 있습니다.");
            router.push(`/board/${id}`);
            return;
          }
          setCategory(post.category);
          setTitle(post.title);
          setContent(post.content);
          setIsPublic(post.is_public !== false);
        } else {
          alert("게시글을 찾을 수 없습니다.");
          router.push("/board");
        }
      } catch {
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
        router.push("/board");
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchPost();
  }, [id, session, router]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 max-w-[760px] mx-auto">
        <p className="text-h2 text-ink-black">로그인이 필요합니다</p>
        <Link href="/login">
          <Button variant="primary" size="md">
            로그인하기
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ink-black border-t-transparent rounded-full animate-spin" />
          <span className="text-body-sm text-shadow-gray">불러오는 중…</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/board/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          is_public: isPublic,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/board/${id}`);
      } else {
        setError(data.error || "게시글 수정에 실패했습니다.");
      }
    } catch {
      setError("게시글 수정 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors";

  return (
    <div className="space-y-6 animate-fade-in max-w-[760px] mx-auto">
      <div>
        <h1 className="text-h1 text-ink-black">글 수정</h1>
        <p className="text-body-sm text-shadow-gray mt-1">
          게시글 내용을 수정합니다.
        </p>
      </div>

      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-black">
            작성자
          </label>
          <div className="w-full h-11 rounded-md border border-border-light bg-subtle-ash px-3.5 flex items-center text-body text-thunder-gray">
            {session.user?.name || "익명"}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="title"
            className="text-body-sm font-medium text-ink-black"
          >
            제목
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-md border border-border-light bg-canvas-white px-3 text-body-sm text-ink-black focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 sm:w-32"
            >
              <option value="일반">일반</option>
              <option value="질문">질문</option>
              {userIsAdmin && (
                <>
                  <option value="Q&A">Q&A</option>
                  <option value="공지">공지</option>
                </>
              )}
            </select>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className={`flex-1 min-w-0 ${fieldClass}`}
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-ink-black">
            공개 여부
          </label>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={isPublic}
              onClick={() => setIsPublic(true)}
              className={clsx(
                "h-11 inline-flex items-center justify-center gap-2 rounded-md border text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue",
                isPublic
                  ? "border-ink-black bg-ink-black/5 text-ink-black"
                  : "border-border-light bg-canvas-white text-thunder-gray hover:bg-subtle-ash",
              )}
            >
              <Globe size={15} strokeWidth={1.75} />
              공개
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!isPublic}
              onClick={() => setIsPublic(false)}
              className={clsx(
                "h-11 inline-flex items-center justify-center gap-2 rounded-md border text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue",
                !isPublic
                  ? "border-ink-black bg-ink-black/5 text-ink-black"
                  : "border-border-light bg-canvas-white text-thunder-gray hover:bg-subtle-ash",
              )}
            >
              <Lock size={15} strokeWidth={1.75} />
              비공개
            </button>
          </div>
          <p className="text-caption text-shadow-gray mt-1">
            {isPublic
              ? "모든 사용자가 이 글을 볼 수 있습니다."
              : "본인만 이 글을 볼 수 있습니다."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="content"
            className="text-body-sm font-medium text-ink-black"
          >
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요…"
            rows={12}
            maxLength={5000}
            className="w-full rounded-md border border-border-light bg-canvas-white p-3.5 text-body text-ink-black placeholder:text-steel-gray leading-[1.7] hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors resize-y"
          />
          <div className="text-right text-caption text-shadow-gray font-mono tabular-nums">
            {content.length.toLocaleString()} / 5,000
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-warm-orange/30 bg-warm-orange/8 p-3 flex items-start gap-2 text-body-sm text-warm-orange">
            <AlertTriangle
              size={16}
              strokeWidth={1.75}
              className="mt-0.5 flex-shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-light">
          <Link href={`/board/${id}`}>
            <Button variant="secondary" size="md">
              <ArrowLeft size={16} strokeWidth={1.75} />
              취소
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={submitting}
            isLoading={submitting}
          >
            <Save size={15} strokeWidth={1.75} />
            {submitting ? "수정 중…" : "수정 완료"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
