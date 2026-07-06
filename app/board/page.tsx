"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  PenSquare,
  Pin,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface BoardPost {
  id: number;
  category: string;
  title: string;
  author_name: string;
  author_email: string;
  views: number;
  is_pinned: boolean;
  is_public: boolean;
  created_at: string;
}

interface BoardData {
  pinnedPosts: BoardPost[];
  posts: BoardPost[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}분 전`;
    return `${Math.floor(hours)}시간 전`;
  }

  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");
}

function maskName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

export default function BoardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeSearchType, setActiveSearchType] = useState("title");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage.toString() });
        if (activeSearch) {
          params.set("search", activeSearch);
          params.set("searchType", activeSearchType);
        }
        const res = await fetch(`/api/board?${params}`);
        const data = await res.json();
        if (data.success) setBoardData(data.data);
      } catch (error) {
        console.error("Board fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage, activeSearch, activeSearchType]);

  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchQuery);
    setActiveSearchType(searchType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalCount = boardData?.totalCount || 0;
  const totalPages = boardData?.totalPages || 1;

  const renderPostRow = (post: BoardPost, isPinned = false) => {
    const variant = categoryVariant[post.category] ?? "neutral";

    return (
      <tr
        key={post.id}
        className={clsx(
          "border-b border-border-light hover:bg-subtle-ash transition-colors cursor-pointer",
          isPinned && "bg-subtle-ash/60",
        )}
        onClick={() => router.push(`/board/${post.id}`)}
      >
        <td className="py-3 px-3 text-center w-14">
          {isPinned ? (
            <Pin
              size={14}
              strokeWidth={2}
              className="inline text-fresh-green"
            />
          ) : (
            <span className="text-caption text-shadow-gray font-mono tabular-nums">
              {post.id}
            </span>
          )}
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex">
              <Badge variant={variant}>{post.category}</Badge>
            </span>
            <span className="text-body-sm text-ink-black truncate">
              {post.title}
            </span>
            {post.is_public === false && (
              <Lock
                size={13}
                className="text-steel-gray flex-shrink-0"
                strokeWidth={1.75}
              />
            )}
          </div>
        </td>
        <td className="py-3 px-3 text-center text-body-sm text-thunder-gray whitespace-nowrap hidden sm:table-cell w-28">
          {maskName(post.author_name)}
        </td>
        <td className="py-3 px-3 text-center text-caption text-shadow-gray whitespace-nowrap hidden md:table-cell w-32 font-mono tabular-nums">
          {formatDate(post.created_at)}
        </td>
        <td className="py-3 px-3 text-center text-caption text-shadow-gray whitespace-nowrap hidden md:table-cell w-20">
          <span className="inline-flex items-center justify-center gap-1">
            <Eye size={13} strokeWidth={1.75} />
            <span className="font-mono tabular-nums">{post.views}</span>
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink-black">게시판</h1>
          <p className="text-body-sm text-shadow-gray mt-1">
            연말정산 관련 질문과 정보를 자유롭게 나눠보세요.
          </p>
        </div>
        {session && (
          <Link href="/board/write">
            <Button variant="primary" size="md">
              <PenSquare size={16} strokeWidth={1.75} />새 글 쓰기
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="h-11 rounded-md border border-border-light bg-canvas-white px-3 text-body-sm text-ink-black focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30"
          >
            <option value="title">제목</option>
            <option value="author">글쓴이</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어를 입력하세요"
            className="flex-1 min-w-0 h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30"
          />
          <Button variant="primary" size="md" onClick={handleSearch}>
            <Search size={15} strokeWidth={1.75} />
            검색
          </Button>
        </div>
        {totalCount > 0 && (
          <p className="mt-3 text-caption text-shadow-gray">
            총{" "}
            <span className="font-mono tabular-nums text-ink-black">
              {totalCount.toLocaleString()}
            </span>
            건 ·{" "}
            <span className="font-mono tabular-nums">
              {currentPage} / {totalPages}
            </span>{" "}
            페이지
          </p>
        )}
      </Card>

      {/* Board Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-subtle-ash border-b border-border-light">
                <th className="py-3 px-3 text-center text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] w-14">
                  번호
                </th>
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em]">
                  제목
                </th>
                <th className="py-3 px-3 text-center text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] w-28 hidden sm:table-cell">
                  글쓴이
                </th>
                <th className="py-3 px-3 text-center text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] w-32 hidden md:table-cell">
                  날짜
                </th>
                <th className="py-3 px-3 text-center text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] w-20 hidden md:table-cell">
                  조회
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-ink-black border-t-transparent rounded-full animate-spin" />
                      <span className="text-body-sm text-shadow-gray">
                        불러오는 중…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {boardData?.pinnedPosts.map((post) =>
                    renderPostRow(post, true),
                  )}
                  {boardData?.posts.map((post) => renderPostRow(post))}

                  {!boardData?.pinnedPosts.length &&
                    !boardData?.posts.length && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <MessageSquare
                              size={36}
                              strokeWidth={1.5}
                              className="text-steel-gray"
                            />
                            <p className="text-body-sm text-shadow-gray">
                              아직 게시글이 없습니다.
                            </p>
                            {session && (
                              <Link
                                href="/board/write"
                                className="text-body-sm font-medium text-accent-blue hover:text-ink-black transition-colors"
                              >
                                첫 번째 글을 작성해보세요 →
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-9 h-9 rounded-md border border-border-light bg-canvas-white text-thunder-gray hover:bg-subtle-ash disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue"
            aria-label="이전 페이지"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (currentPage <= 3) pageNum = i + 1;
            else if (currentPage >= totalPages - 2)
              pageNum = totalPages - 4 + i;
            else pageNum = currentPage - 2 + i;
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={clsx(
                  "w-9 h-9 rounded-md text-body-sm font-medium font-mono tabular-nums flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue",
                  isActive
                    ? "bg-ink-black text-canvas-white"
                    : "border border-border-light bg-canvas-white text-thunder-gray hover:bg-subtle-ash",
                )}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-9 h-9 rounded-md border border-border-light bg-canvas-white text-thunder-gray hover:bg-subtle-ash disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue"
            aria-label="다음 페이지"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
