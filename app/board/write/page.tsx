"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, FileText, Lock, Globe } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

// 관리자 이메일 목록 (클라이언트용)
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ysong2526@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());

export default function BoardWritePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userIsAdmin = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase() || "");
    const [category, setCategory] = useState("일반");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-2xl font-black">로그인이 필요합니다 🔐</p>
                <Link href="/login" className="neo-btn !py-3 !px-5">
                    로그인하기
                </Link>
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
            const res = await fetch("/api/board", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, category, is_public: isPublic }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/board");
            } else {
                setError(data.error || "게시글 작성에 실패했습니다.");
            }
        } catch {
            setError("게시글 작성 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 animate-fade-in max-w-3xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neo-cyan border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
                    <FileText size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                        글쓰기
                    </h1>
                    <p className="text-sm font-bold text-gray-500">
                        연말정산 관련 질문, 정보를 공유해보세요
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="neo-card bg-white space-y-5">
                {/* Author */}
                <div>
                    <label className="block font-black text-sm mb-2 uppercase tracking-wide">
                        이 름
                    </label>
                    <div className="w-full p-4 border-[3px] border-black bg-gray-100 font-bold text-lg text-gray-600">
                        {session.user?.name || "익명"}
                    </div>
                </div>

                {/* Category + Title */}
                <div>
                    <label className="block font-black text-sm mb-2 uppercase tracking-wide">
                        제 목
                    </label>
                    <div className="flex gap-3">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border-[3px] border-black px-4 py-3 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFB800] transition-shadow"
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
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="flex-1 min-w-0 p-4 border-[3px] border-black font-bold text-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFB800] transition-shadow bg-white"
                            maxLength={100}
                        />
                    </div>
                </div>

                {/* Public/Private Toggle */}
                <div>
                    <label className="block font-black text-sm mb-2 uppercase tracking-wide">
                        공개 여부
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsPublic(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-black font-bold transition-all ${isPublic
                                    ? "bg-neo-cyan shadow-[4px_4px_0px_0px_#000] text-black"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            <Globe size={18} />
                            공개
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPublic(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-black font-bold transition-all ${!isPublic
                                    ? "bg-neo-orange text-white shadow-[4px_4px_0px_0px_#000]"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            <Lock size={18} />
                            비공개
                        </button>
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                        {isPublic
                            ? "✅ 모든 사용자가 이 글을 볼 수 있습니다"
                            : "🔒 본인만 이 글을 볼 수 있습니다"}
                    </p>
                </div>

                {/* Content */}
                <div>
                    <label className="block font-black text-sm mb-2 uppercase tracking-wide">
                        내 용
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력하세요..."
                        rows={12}
                        className="w-full p-4 border-[3px] border-black font-bold text-base leading-relaxed focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFB800] transition-shadow bg-white resize-y"
                        maxLength={5000}
                    />
                    <div className="text-right text-xs font-bold text-gray-400 mt-1">
                        {content.length} / 5,000
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-100 border-[3px] border-red-400 font-bold text-red-600 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                        <Link
                            href="/board"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-[3px] border-black font-bold shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] active:shadow-none transition-all"
                        >
                            <ArrowLeft size={18} />
                            목록보기
                        </Link>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-neo-orange text-white border-[3px] border-black font-black text-lg shadow-[6px_6px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                            {submitting ? "등록 중..." : "새글 등록"}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
