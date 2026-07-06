"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Gift,
  Shield,
  CreditCard,
  Home,
  PiggyBank,
  Building,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────
 * Premium Dark Fintech (v3) 랜딩
 * off-black base + electric mint accent + mono 숫자 + asymmetric hero.
 * 행동/로직 0 변경 — 시각 정체성만 교체.
 * ──────────────────────────────────────────────────────────────────── */

const deductions = [
  { icon: HeartPulse, label: "의료비" },
  { icon: GraduationCap, label: "교육비" },
  { icon: Gift, label: "기부금" },
  { icon: Shield, label: "보험료" },
  { icon: CreditCard, label: "신용카드" },
  { icon: Home, label: "주택자금" },
  { icon: PiggyBank, label: "연금저축" },
  { icon: Building, label: "월세" },
];

const previewRows = [
  { label: "신용카드 소득공제", amount: "1,240,000" },
  { label: "의료비 세액공제", amount: "382,500" },
  { label: "연금저축 세액공제", amount: "660,000" },
];

const reviews = [
  {
    name: "김민수",
    role: "직장인 5년차",
    content:
      "작년보다 30만원 더 환급받았어요. 연금저축 추가 납입 추천이 정확했습니다.",
  },
  {
    name: "이지영",
    role: "프리랜서",
    content:
      "복잡한 공제 항목을 한눈에 볼 수 있어서 좋았습니다. 의료비 공제도 놓치지 않고 챙겼어요.",
  },
];

const stats = [
  { value: "10만+", label: "누적 사용자" },
  { value: "35만원", label: "평균 환급액" },
  { value: "98%", label: "사용자 만족도" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const primaryHref = session ? "/dashboard" : "/signup";
  const primaryLabel = session ? "대시보드로 가기" : "무료로 시작하기";

  return (
    <div className="-mt-8">
      {/* ─────────────────────────────────────────────────────────
       * Hero — asymmetric split + ambient mint glow
       * ──────────────────────────────────────────────────────── */}
      <section className="relative w-full max-w-[1200px] mx-auto px-4 pt-20 md:pt-28 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-40 h-[560px] w-[560px] rounded-full blur-[130px] opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(53,228,164,0.18), transparent 70%)",
          }}
        />
        <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          {/* left — copy */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-edge bg-surface text-caption font-medium text-mint">
              <span className="w-1.5 h-1.5 rounded-full bg-mint" />
              2026 세법 개정안 반영
            </span>
            <h1 className="text-hero text-hi max-w-xl">
              올해의 환급,
              <br />
              <span className="text-mint">분명하게</span> 정리합니다.
            </h1>
            <p className="text-subheading text-mid max-w-lg text-pretty">
              taxback365는 한국 직장인의 연말정산을 데이터로 정리합니다. 놓치기
              쉬운 공제부터 추가 절세 여지까지 한 화면에서 확인하세요.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1 w-full sm:w-auto">
              <Link
                href={primaryHref}
                className="group inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-mint text-ink font-semibold hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base"
              >
                {primaryLabel}
                <ArrowRight
                  size={16}
                  strokeWidth={2.25}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-edge-strong text-hi text-body font-medium hover:bg-surface active:scale-[0.98] transition-all"
              >
                환급 시뮬레이터
              </Link>
            </div>
            <p className="text-caption text-dim">
              카드사·금융기관 데이터 연동, 평균 5분 입력
            </p>
          </div>

          {/* right — preview card */}
          <div className="relative">
            <div className="rounded-2xl border border-edge bg-surface p-6 md:p-7 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.75)]">
              <div className="flex items-center justify-between">
                <p className="text-caption font-medium uppercase tracking-[0.08em] text-dim">
                  실시간 환급 예상
                </p>
                <span className="inline-flex items-center gap-1 text-caption text-mint">
                  <TrendingUp size={12} strokeWidth={2.25} />
                  <span className="font-mono tabular-nums">+12.4%</span>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-mono-display text-[52px] leading-none font-semibold text-mint tabular-nums">
                  +387,250
                </span>
                <span className="text-subheading text-mid font-mono">원</span>
              </div>
              <p className="mt-2 text-body-sm text-dim">
                전년 대비 예상 환급 증가분 포함
              </p>
              <div className="mt-6 space-y-3 border-t border-edge pt-5">
                {previewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-body-sm"
                  >
                    <span className="text-mid">{row.label}</span>
                    <span className="font-mono tabular-nums text-hi">
                      {row.amount}
                      <span className="text-dim ml-1">원</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Deduction categories — pill cloud (카드 그리드와 다른 레이아웃 패밀리)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <h2 className="text-h2 text-hi max-w-md">
            놓치기 쉬운 공제, <span className="text-mint">8가지</span>.
          </h2>
          <p className="text-body-sm text-mid max-w-sm md:text-right">
            각 항목을 누르면 계산기로 이동합니다. 지출과 소득에 맞춰 환급 가능
            금액을 즉시 확인하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {deductions.map(({ icon: Icon, label }) => (
            <Link
              key={label}
              href="/calculator"
              className="group inline-flex items-center gap-2.5 pl-3 pr-4 h-11 rounded-full border border-edge bg-surface text-mid hover:text-mint hover:border-mint/40 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-2 group-hover:bg-mint/10 transition-colors">
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <span className="text-body-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Features — bento (1 large + 2 stacked), 3-equal 반복 회피
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-14">
        <div className="max-w-xl mb-10">
          <h2 className="text-h2 text-hi">정확함과 속도, 둘 다.</h2>
          <p className="text-body text-mid mt-2">
            복잡함 없이 자신 있게 신고하기 위한 모든 도구가 한 곳에.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* featured */}
          <div className="md:row-span-2 flex flex-col justify-between gap-8 rounded-2xl border border-edge bg-surface p-7 relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full blur-[90px] opacity-50"
              style={{
                background:
                  "radial-gradient(circle, rgba(53,228,164,0.16), transparent 70%)",
              }}
            />
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-mint/10 text-mint">
              <Sparkles size={22} strokeWidth={1.75} />
            </div>
            <div className="relative">
              <h3 className="text-h3 text-hi">데이터 기반 자동 분석</h3>
              <p className="text-body text-mid mt-3 leading-relaxed max-w-sm">
                입력된 소비 패턴을 분석해 놓치기 쉬운 공제 항목을 자동으로
                찾아냅니다. 서류를 뒤질 필요 없이, 데이터가 답을 제시합니다.
              </p>
            </div>
          </div>
          {/* two stacked */}
          <div className="rounded-2xl border border-edge bg-surface p-7 flex flex-col gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-surface-2 text-mint">
              <TrendingUp size={20} strokeWidth={1.75} />
            </div>
            <h3 className="text-h3 text-hi">정확한 환급 시뮬레이션</h3>
            <p className="text-body-sm text-mid leading-relaxed">
              2026년 세법 개정안을 반영해 예상 환급 가능 금액을 실시간으로
              계산합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-edge bg-surface p-7 flex flex-col gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-surface-2 text-mint">
              <ShieldCheck size={20} strokeWidth={1.75} />
            </div>
            <h3 className="text-h3 text-hi">한 번의 정리, 한 해의 답</h3>
            <p className="text-body-sm text-mid leading-relaxed">
              한 번 정리한 데이터를 바탕으로 복잡한 서류 없이 올해의 환급을
              마무리합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Stats — mono 숫자 surface band
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-edge bg-surface divide-y md:divide-y-0 md:divide-x divide-edge overflow-hidden">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-10">
              <span className="text-mono-display text-[40px] leading-none font-semibold text-hi tabular-nums">
                {value}
              </span>
              <span className="text-caption uppercase tracking-[0.08em] text-dim">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Reviews — 2-col offset (features 카드와 시각 차별화)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-14">
        <div className="max-w-xl mb-10">
          <h2 className="text-h2 text-hi">실제 직장인이 받은 환급.</h2>
          <p className="text-body text-mid mt-2">
            taxback365를 사용한 사람들의 이야기를 들어보세요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {reviews.map((review) => (
            <figure
              key={review.name}
              className="min-w-0 rounded-2xl border border-edge bg-surface p-7 flex flex-col gap-5"
            >
              <blockquote className="text-subheading text-hi leading-relaxed">
                &ldquo;{review.content}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-edge">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-mint/10 text-mint text-body-sm font-semibold">
                  {review.name.slice(0, 1)}
                </span>
                <span className="flex flex-col">
                  <span className="text-body-sm font-medium text-hi">
                    {review.name}
                  </span>
                  <span className="text-caption text-dim">{review.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Final CTA — mint-glow dark card
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface px-6 py-16 md:py-20 flex flex-col items-center text-center gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-72 w-[520px] rounded-full blur-[130px] opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(53,228,164,0.20), transparent 70%)",
            }}
          />
          <h2 className="relative text-h1 text-hi max-w-2xl">
            환급은 멀리 있지 않습니다.
            <br />
            지금 바로 시작하세요.
          </h2>
          <p className="relative text-subheading text-mid max-w-xl">
            데이터를 한 번 정리하면, 매년 자동으로 답을 받아볼 수 있습니다.
          </p>
          <Link
            href={primaryHref}
            className="relative group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-mint text-ink font-semibold hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {primaryLabel}
            <ArrowRight
              size={16}
              strokeWidth={2.25}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
