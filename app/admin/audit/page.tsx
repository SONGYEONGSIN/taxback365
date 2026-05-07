import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
    title: "감사 로그",
    description: "보안·관리 이벤트 기록",
    robots: { index: false },
};

interface AuditLog {
    id: number;
    user_email: string | null;
    action: string;
    target: string | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

const PAGE_SIZE = 50;

interface SearchParams {
    page?: string;
    action?: string;
}

// middleware.ts가 /admin/** 1차 차단. 본 페이지도 server-side에서 가드 (defense-in-depth).
export default async function AuditPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth();
    if (!session?.user?.email) redirect("/login?callbackUrl=/admin/audit");
    if (!isAdmin(session.user.email)) redirect("/");

    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const filterAction = params.action?.trim() || null;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabaseAdmin
        .from("audit_logs")
        .select("id, user_email, action, target, metadata, ip_address, user_agent, created_at", {
            count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (filterAction) {
        query = query.eq("action", filterAction);
    }

    const { data, count } = await query;
    const logs = (data ?? []) as AuditLog[];
    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "medium" });

    const buildHref = (p: number) => {
        const sp = new URLSearchParams();
        sp.set("page", String(p));
        if (filterAction) sp.set("action", filterAction);
        return `/admin/audit?${sp.toString()}`;
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">감사 로그</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            보안·관리 이벤트 기록 ({totalCount.toLocaleString()}건)
                        </p>
                    </div>
                    <Link
                        href="/admin"
                        className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-gray-100"
                    >
                        ← 기초자료
                    </Link>
                </div>

                {/* 필터 */}
                <form className="mb-4 flex gap-2" action="/admin/audit" method="get">
                    <input
                        type="text"
                        name="action"
                        defaultValue={filterAction ?? ""}
                        placeholder="action 필터 (예: login.success)"
                        className="flex-1 px-3 py-2 border-2 border-black bg-white"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 font-bold border-2 border-black bg-neo-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                        필터
                    </button>
                    {filterAction && (
                        <Link
                            href="/admin/audit"
                            className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-gray-100"
                        >
                            초기화
                        </Link>
                    )}
                </form>

                {/* 테이블 */}
                <div className="border-2 border-black bg-white overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neo-cyan border-b-2 border-black">
                            <tr>
                                <th className="px-3 py-2 text-left font-black">시각</th>
                                <th className="px-3 py-2 text-left font-black">사용자</th>
                                <th className="px-3 py-2 text-left font-black">Action</th>
                                <th className="px-3 py-2 text-left font-black">Target</th>
                                <th className="px-3 py-2 text-left font-black">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                                        기록 없음
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">{formatTime(log.created_at)}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{log.user_email ?? "—"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{log.action}</td>
                                        <td className="px-3 py-2 text-xs">{log.target ?? "—"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{log.ip_address ?? "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {page} / {totalPages} 페이지
                        </p>
                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={buildHref(page - 1)}
                                    className="px-3 py-1 font-bold border-2 border-black bg-white hover:bg-gray-100"
                                >
                                    ← 이전
                                </Link>
                            )}
                            {page < totalPages && (
                                <Link
                                    href={buildHref(page + 1)}
                                    className="px-3 py-1 font-bold border-2 border-black bg-white hover:bg-gray-100"
                                >
                                    다음 →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
