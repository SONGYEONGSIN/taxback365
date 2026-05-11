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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const deductionCategories = [
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
  { value: "10萬", suffix: "+", label: "누적 사용자" },
  { value: "35", suffix: "萬원", label: "평균 환급액" },
  { value: "98", suffix: "%", label: "사용자 만족도" },
];

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="animate-fade-in -mt-8">
      {/* Hero Section — 좌측 카피 + 우측 시뮬레이션 카드 */}
      <section className="bg-hero-gradient w-[100vw] ml-[calc(50%-50vw)] -mt-px">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <Badge variant="success" className="mb-5">
              2026 세법 개정안 반영
            </Badge>
            <h1 className="text-hero text-foreground">
              올해의 환급,
              <br />
              <span className="text-primary">분명하게.</span>
            </h1>
            <p className="text-body text-neutral-700 mt-5 max-w-md leading-[1.7]">
              taxback365는 한국 직장인의 연말정산을 데이터로 정리합니다. 놓치기
              쉬운 공제부터 추가 절세 여지까지 한 화면에서 확인하세요.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={session ? "/dashboard" : "/login"}>
                <Button variant="primary" size="md">
                  {session ? "대시보드로 가기" : "무료로 시작하기"}
                  <ArrowRight size={16} strokeWidth={1.75} />
                </Button>
              </Link>
              <Link href="/calculator">
                <Button variant="ghost" size="md">
                  환급 시뮬레이터
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-caption text-neutral-500">
              카드사·금융기관 데이터 연동, 평균 5분 입력
            </p>
          </div>

          {/* 환급 시뮬레이션 카드 */}
          <Card
            variant="raised"
            padding="lg"
            className="lg:max-w-[440px] lg:ml-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em]">
                환급 예상
              </span>
              <Badge variant="success">실시간</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-mono-display text-[44px] leading-[1] font-semibold text-foreground">
                +387,250
              </span>
              <span className="text-caption text-neutral-300 font-mono">
                萬원
              </span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-body-sm text-mint-dark">
              <TrendingUp size={14} strokeWidth={2} />
              <span className="font-mono tabular-nums">+12.4%</span>
              <span className="text-neutral-500">전년 대비</span>
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-200 space-y-3">
              {[
                { label: "신용카드 소득공제", amount: "1,240,000" },
                { label: "의료비 세액공제", amount: "382,500" },
                { label: "기부금 세액공제", amount: "95,000" },
                { label: "연금저축 세액공제", amount: "660,000" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-body-sm"
                >
                  <span className="text-neutral-700">{row.label}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {row.amount}
                    <span className="text-neutral-500 ml-1">원</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* 기능 — 카드 3개 대신 가로 strip + alternating focus */}
      <section className="w-full max-w-[1200px] px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-caption font-semibold text-mint-dark uppercase tracking-[0.06em]">
            Why taxback365
          </p>
          <h2 className="text-h1 text-foreground mt-2">
            세무 신고가 아닌, 자산 관리의 시간으로.
          </h2>
        </div>
        <div className="mt-12 divide-y divide-neutral-200 border-t border-neutral-200">
          {features.map(({ Icon, title, description }, idx) => (
            <div
              key={title}
              className="grid md:grid-cols-[120px_1fr_2fr] gap-4 md:gap-8 py-8 items-start"
            >
              <span className="text-mono-display text-[28px] text-neutral-300">
                0{idx + 1}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/8 text-primary flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="text-h3 text-foreground">{title}</h3>
              </div>
              <p className="text-body text-neutral-700 leading-[1.7]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 공제 항목 8개 — 좌측 카피 + 우측 그리드 */}
      <section className="w-full bg-neutral-50">
        <div className="max-w-[1200px] mx-auto px-6 py-24 grid md:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div className="md:sticky md:top-24">
            <p className="text-caption font-semibold text-mint-dark uppercase tracking-[0.06em]">
              놓치지 마세요
            </p>
            <h2 className="text-h1 text-foreground mt-2">
              공제 항목 8가지,
              <br />한 번에 챙기기.
            </h2>
            <p className="text-body text-neutral-700 mt-4 leading-[1.7]">
              각 항목은 클릭만으로 계산기로 이동합니다. 나의 지출과 소득에 맞춰
              환급 가능 금액을 즉시 확인하세요.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {deductionCategories.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                href="/calculator"
                className="group rounded-lg border border-neutral-200 bg-card p-5 flex flex-col gap-3 hover:shadow-resting hover:border-neutral-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <span className="w-9 h-9 rounded-md bg-neutral-100 group-hover:bg-mint/15 group-hover:text-mint-dark text-neutral-700 flex items-center justify-center transition-colors">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="text-body-sm font-medium text-foreground">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 사용자 후기 — 카드 3개 그리드 유지하되 톤만 정돈 */}
      <section className="w-full max-w-[1200px] px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-caption font-semibold text-mint-dark uppercase tracking-[0.06em]">
            사용자의 말
          </p>
          <h2 className="text-h1 text-foreground mt-2">
            실제 직장인이 받은 환급, 그 이야기.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <Card key={review.name} padding="lg" className="relative">
              <Quote
                size={20}
                strokeWidth={1.5}
                className="text-neutral-300 absolute top-5 right-5"
              />
              <div
                className="flex gap-0.5 mb-4 text-mint-dark"
                aria-label="별점 5점"
              >
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-body text-foreground leading-[1.7] mb-6">
                &ldquo;{review.content}&rdquo;
              </p>
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-body-sm font-medium text-foreground">
                  {review.name}
                </p>
                <p className="text-caption text-neutral-500">{review.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats — 풀 와이드 단일 행 (gradient·rainbow color 폐기) */}
      <section className="w-[100vw] ml-[calc(50%-50vw)] bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {stats.map(({ value, suffix, label }) => (
              <div
                key={label}
                className="flex flex-col gap-1 border-l border-card/15 pl-6"
              >
                <span className="text-caption text-card/60 uppercase tracking-[0.06em]">
                  {label}
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-mono-display text-[40px] leading-none font-semibold">
                    {value}
                  </span>
                  <span className="text-body-sm text-card/60 font-mono">
                    {suffix}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full max-w-[1200px] px-6 py-24 text-center">
        <h2 className="text-h1 text-foreground">환급은 멀리 있지 않습니다.</h2>
        <p className="text-body text-neutral-700 mt-3 max-w-lg mx-auto leading-[1.7]">
          데이터를 한 번 정리하면, 매년 자동으로 답을 받아볼 수 있습니다.
        </p>
        <div className="mt-8">
          <Link href={session ? "/dashboard" : "/signup"}>
            <Button variant="primary" size="md">
              {session ? "대시보드로" : "무료 회원가입"}
              <ArrowRight size={16} strokeWidth={1.75} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
