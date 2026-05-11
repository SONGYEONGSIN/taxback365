import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

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
    .select(
      "id, user_email, action, target, metadata, ip_address, user_agent, created_at",
      {
        count: "exact",
      },
    )
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
    new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "medium",
    });

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    if (filterAction) sp.set("action", filterAction);
    return `/admin/audit?${sp.toString()}`;
  };

  return (
    <div className="min-h-screen bg-canvas-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-h1 text-ink-black">감사 로그</h1>
            <p className="text-body-sm text-shadow-gray mt-1">
              보안·관리 이벤트 기록 ({totalCount.toLocaleString()}건)
            </p>
          </div>
          <Link href="/admin">
            <Button variant="secondary" size="sm">
              ← 기초자료
            </Button>
          </Link>
        </div>

        <form
          className="mb-4 flex gap-2 flex-wrap"
          action="/admin/audit"
          method="get"
        >
          <input
            type="text"
            name="action"
            defaultValue={filterAction ?? ""}
            placeholder="action 필터 (예: login.success)"
            className="flex-1 min-w-[200px] h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30"
          />
          <Button type="submit" variant="primary" size="md">
            필터
          </Button>
          {filterAction && (
            <Link href="/admin/audit">
              <Button variant="ghost" size="md">
                초기화
              </Button>
            </Link>
          )}
        </form>

        <div className="rounded-lg border border-border-light bg-canvas-white overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-subtle-ash border-b border-border-light">
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] whitespace-nowrap">
                  시각
                </th>
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] whitespace-nowrap">
                  사용자
                </th>
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] whitespace-nowrap">
                  Action
                </th>
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] whitespace-nowrap hidden md:table-cell">
                  Target
                </th>
                <th className="py-3 px-3 text-left text-caption font-semibold text-shadow-gray uppercase tracking-[0.06em] whitespace-nowrap hidden lg:table-cell">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-body-sm text-shadow-gray"
                  >
                    기록 없음
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-subtle-ash transition-colors"
                  >
                    <td className="py-2 px-3 whitespace-nowrap text-caption text-thunder-gray font-mono tabular-nums">
                      {formatTime(log.created_at)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-body-sm text-ink-black">
                      {log.user_email ?? "—"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-caption font-mono text-ink-black">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-caption text-thunder-gray hidden md:table-cell">
                      {log.target ?? "—"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-caption text-shadow-gray font-mono tabular-nums hidden lg:table-cell">
                      {log.ip_address ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-body-sm text-shadow-gray">
              <span className="font-mono tabular-nums">{page}</span> /{" "}
              <span className="font-mono tabular-nums">{totalPages}</span>{" "}
              페이지
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildHref(page - 1)}>
                  <Button variant="secondary" size="sm">
                    ← 이전
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildHref(page + 1)}>
                  <Button variant="secondary" size="sm">
                    다음 →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
