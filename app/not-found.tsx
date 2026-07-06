import Link from "next/link";

/* 다크 핀테크 브랜디드 404 — 막다른 길 방지용 back 내비 포함 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6 px-4 py-16">
      <p className="text-mono-display text-[96px] leading-none font-semibold text-mint tabular-nums">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-hi">페이지를 찾을 수 없습니다</h1>
        <p className="text-body text-mid max-w-md">
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래에서 이어서
          진행하세요.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-mint text-ink text-body font-semibold hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base w-full sm:w-auto"
        >
          홈으로
        </Link>
        <Link
          href="/calculator"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-edge-strong text-hi text-body font-medium hover:bg-surface active:scale-[0.98] transition-all w-full sm:w-auto"
        >
          환급 시뮬레이터
        </Link>
      </div>
    </div>
  );
}
