"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  HeartPulse,
  GraduationCap,
  Gift,
  Shield,
  CreditCard,
  Home,
  PiggyBank,
  Building,
  Star,
  Quote,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────
 * Dub Design System 기반 랜딩 — design-ref/code.html 구조를 한국어 카피로 이식.
 * 중앙 정렬 hero / centered subtitle / black-pill CTA pair / outlined card grid /
 * subtle-ash CTA band / minimal footer.
 * 행동/로직 0 — 시각 정체성만 교체.
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

const features = [
  {
    Icon: Sparkles,
    title: "데이터 기반 분석",
    description:
      "입력된 소비 패턴을 분석하여 놓치기 쉬운 공제 항목을 자동으로 찾아냅니다.",
  },
  {
    Icon: TrendingUp,
    title: "정확한 환급 시뮬레이션",
    description:
      "2026년 세법 개정안을 반영해 예상 환급 가능 금액을 실시간으로 계산합니다.",
  },
  {
    Icon: CheckCircle2,
    title: "한 번의 정리, 한 해의 답",
    description:
      "복잡한 서류 없이, 한 번 정리한 데이터를 바탕으로 올해의 환급을 마무리합니다.",
  },
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
  {
    name: "박준혁",
    role: "신입사원",
    content:
      "처음 연말정산 하는데 무엇을 준비해야 할지 단계별로 안내해줘서 헷갈리지 않았습니다.",
  },
];

const stats = [
  { value: "10萬+", label: "누적 사용자" },
  { value: "35萬원", label: "평균 환급액" },
  { value: "98%", label: "사용자 만족도" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const primaryHref = session ? "/dashboard" : "/signup";
  const primaryLabel = session ? "대시보드로 가기" : "무료로 시작하기";

  return (
    <div className="-mt-8 flex flex-col items-center">
      {/* ─────────────────────────────────────────────────────────
       * Hero — 중앙 정렬 (design-ref §Hero)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 py-24 md:py-32 flex flex-col items-center text-center gap-8">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-highlight-green/20 text-fresh-green text-caption font-medium">
          2026 세법 개정안 반영
        </span>
        <h1 className="text-hero text-ink-black max-w-3xl tracking-tight">
          올해의 환급,
          <br />
          분명하게 정리합니다.
        </h1>
        <p className="text-subheading text-shadow-gray max-w-2xl">
          taxback365는 한국 직장인의 연말정산을 데이터로 정리합니다. 놓치기 쉬운
          공제부터 추가 절세 여지까지 한 화면에서 확인하세요.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-ink-black text-canvas-white text-body font-medium hover:opacity-90 transition-opacity shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 focus-visible:ring-offset-2 w-full sm:w-auto"
          >
            {primaryLabel}
            <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-transparent text-ink-black text-body font-medium hover:bg-subtle-ash transition-colors w-full sm:w-auto"
          >
            환급 시뮬레이터
          </Link>
        </div>
        <p className="text-caption text-shadow-gray">
          카드사·금융기관 데이터 연동, 평균 5분 입력
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Product Preview — 다크 카드 안에 환급 시뮬레이션 (design-ref §Preview)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 pb-16 md:pb-24">
        <div className="w-full bg-canvas-white rounded-2xl shadow-subtle-2 border border-border-light overflow-hidden">
          {/* mock browser chrome */}
          <div className="h-12 border-b border-border-light bg-subtle-ash flex items-center px-4 gap-2">
            <span className="w-3 h-3 rounded-full bg-border-muted" />
            <span className="w-3 h-3 rounded-full bg-border-muted" />
            <span className="w-3 h-3 rounded-full bg-border-muted" />
          </div>

          {/* 환급 시뮬레이션 콘텐츠 */}
          <div className="bg-canvas-white p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-caption font-medium uppercase tracking-[0.06em] text-shadow-gray">
                  실시간 환급 예상
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-mono-display text-[56px] leading-none font-semibold text-ink-black tabular-nums">
                    +387,250
                  </span>
                  <span className="text-subheading text-shadow-gray font-mono">
                    원
                  </span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-body-sm text-fresh-green">
                  <TrendingUp size={14} strokeWidth={2} />
                  <span className="font-mono tabular-nums">+12.4%</span>
                  <span className="text-shadow-gray">전년 대비</span>
                </p>
                <p className="mt-6 text-body text-thunder-gray leading-relaxed">
                  소득공제와 세액공제를 자동 분류해 가장 유리한 조합으로 환급
                  금액을 계산합니다.
                </p>
              </div>
              <div className="rounded-xl border border-border-light bg-subtle-ash p-6 space-y-3">
                {[
                  { label: "신용카드 소득공제", amount: "1,240,000" },
                  { label: "의료비 세액공제", amount: "382,500" },
                  { label: "기부금 세액공제", amount: "95,000" },
                  { label: "연금저축 세액공제", amount: "660,000" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-body"
                  >
                    <span className="text-thunder-gray">{row.label}</span>
                    <span className="font-mono tabular-nums text-ink-black">
                      {row.amount}
                      <span className="text-shadow-gray ml-1">원</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Feature Grid — 3-col outlined card (design-ref §Features)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 py-16 flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-h2 text-ink-black">정확함과 속도, 둘 다.</h2>
          <p className="text-body text-shadow-gray mt-2">
            복잡함 없이 자신 있게 신고하기 위한 모든 도구가 한 곳에.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="bg-canvas-white border border-border-light rounded-xl p-6 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-subtle-ash flex items-center justify-center text-ink-black">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <h3 className="text-h3 text-ink-black">{title}</h3>
              <p className="text-body text-shadow-gray leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Deduction Categories — 8개 outlined card grid
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 py-16 flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-h2 text-ink-black">놓치기 쉬운 공제 8가지.</h2>
          <p className="text-body text-shadow-gray mt-2">
            각 항목은 클릭만으로 계산기로 이동합니다. 지출과 소득에 맞춰 환급
            가능 금액을 즉시 확인하세요.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {deductions.map(({ icon: Icon, label }) => (
            <Link
              key={label}
              href="/calculator"
              className="group bg-canvas-white border border-border-light rounded-xl p-5 flex flex-col gap-3 hover:border-border-muted hover:shadow-subtle transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30"
            >
              <span className="w-9 h-9 rounded-lg bg-subtle-ash group-hover:bg-highlight-green/20 group-hover:text-fresh-green text-ink-black flex items-center justify-center transition-colors">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="text-body font-medium text-ink-black">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Reviews — outlined card 3-col
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 py-16 flex flex-col gap-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-h2 text-ink-black">
            실제 직장인이 받은 환급, 그 이야기.
          </h2>
          <p className="text-body text-shadow-gray mt-2">
            taxback365를 사용한 사람들의 후기를 들어보세요.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="bg-canvas-white border border-border-light rounded-xl p-6 flex flex-col gap-4 relative"
            >
              <Quote
                size={20}
                strokeWidth={1.5}
                className="text-border-muted absolute top-5 right-5"
              />
              <div
                className="flex gap-0.5 text-fresh-green"
                aria-label="별점 5점"
              >
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-body text-ink-black leading-relaxed">
                &ldquo;{review.content}&rdquo;
              </p>
              <div className="pt-4 border-t border-border-light">
                <p className="text-body-sm font-medium text-ink-black">
                  {review.name}
                </p>
                <p className="text-caption text-shadow-gray">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Stats — 단순 텍스트 행 (Dub은 풀블리드 다크 띠 미사용)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-full max-w-[1200px] px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-y border-border-light py-12">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-mono-display text-[40px] leading-none font-semibold text-ink-black tabular-nums">
                {value}
              </span>
              <span className="text-caption uppercase tracking-[0.06em] text-shadow-gray">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * Final CTA — subtle-ash band (design-ref §CTA)
       * ──────────────────────────────────────────────────────── */}
      <section className="w-[100vw] ml-[calc(50%-50vw)] bg-subtle-ash border-y border-border-light">
        <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-center text-center gap-8">
          <h2 className="text-h1 text-ink-black max-w-2xl">
            환급은 멀리 있지 않습니다.
            <br />
            지금 바로 시작하세요.
          </h2>
          <p className="text-subheading text-shadow-gray max-w-xl">
            데이터를 한 번 정리하면, 매년 자동으로 답을 받아볼 수 있습니다.
          </p>
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-ink-black text-canvas-white text-body font-medium hover:opacity-90 transition-opacity shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 focus-visible:ring-offset-2"
          >
            {primaryLabel}
            <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </section>
    </div>
  );
}
