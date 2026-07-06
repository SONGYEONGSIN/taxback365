"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
  Sparkles,
  Bell,
  Target,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  PiggyBank,
  CreditCard,
  Home,
  Heart,
  GraduationCap,
  Gift,
  Building,
  Loader2,
  Users,
  ArrowRight,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  loadTaxData,
  loadAdminData,
  generateDeductionAnalysis,
  DeductionAnalysis,
} from "@/lib/tax-store";
import {
  generateRecommendations,
  getDefaultRecommendations,
  calculateTotalPotentialSaving,
  AIRecommendation,
  generateRecommendationsFromAnalysis,
} from "@/lib/ai-recommendation";
import { calculateTax, convertAdminToTaxInputs } from "@/lib/tax-calculator";
import { formatKRW } from "@/lib/number-format";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  isNew: boolean;
}

interface DeductionItem {
  id: string;
  category: string;
  type: "소득공제" | "세액공제";
  amount: number;
  limit: number;
  icon: React.ElementType;
  status: "optimal" | "good" | "warning" | "critical";
}

const MOCK_DEDUCTIONS: DeductionItem[] = [
  {
    id: "1",
    category: "신용카드 등 사용금액",
    type: "소득공제",
    amount: 2500000,
    limit: 3000000,
    icon: CreditCard,
    status: "good",
  },
  {
    id: "2",
    category: "주택마련저축",
    type: "소득공제",
    amount: 2400000,
    limit: 3000000,
    icon: Home,
    status: "good",
  },
  {
    id: "3",
    category: "의료비",
    type: "세액공제",
    amount: 850000,
    limit: 7000000,
    icon: Heart,
    status: "warning",
  },
  {
    id: "4",
    category: "교육비",
    type: "세액공제",
    amount: 3000000,
    limit: 3000000,
    icon: GraduationCap,
    status: "optimal",
  },
  {
    id: "5",
    category: "기부금",
    type: "세액공제",
    amount: 200000,
    limit: 1000000,
    icon: Gift,
    status: "critical",
  },
  {
    id: "6",
    category: "연금저축/IRP",
    type: "세액공제",
    amount: 4000000,
    limit: 7000000,
    icon: PiggyBank,
    status: "warning",
  },
  {
    id: "7",
    category: "보험료",
    type: "세액공제",
    amount: 1000000,
    limit: 1000000,
    icon: Building,
    status: "optimal",
  },
];

const MOCK_NEWS_ARTICLES = [
  {
    id: "1",
    title: "2026년 결혼세액공제 신설, 신혼부부 최대 100만원 환급",
    source: "한국경제",
    time: "2시간 전",
    isNew: true,
    url: "https://www.google.com/search?q=2026+결혼세액공제",
  },
  {
    id: "2",
    title: "청약저축 소득공제 한도 300만원으로 상향...연말정산 혜택 확대",
    source: "매일경제",
    time: "3시간 전",
    isNew: true,
    url: "https://www.google.com/search?q=청약저축+소득공제+한도+상향",
  },
  {
    id: "3",
    title: "연금저축 세액공제, 2026년부터 이렇게 바뀝니다",
    source: "조선비즈",
    time: "5시간 전",
    isNew: false,
    url: "https://www.google.com/search?q=연금저축+세액공제+2026",
  },
  {
    id: "4",
    title: "ISA 만기자금 연금계좌 전환 시 추가 세액공제 혜택",
    source: "머니투데이",
    time: "6시간 전",
    isNew: false,
    url: "https://www.google.com/search?q=ISA+연금계좌+전환+세액공제",
  },
  {
    id: "5",
    title: "신용카드 vs 체크카드, 연말정산 절세 전략 총정리",
    source: "중앙일보",
    time: "8시간 전",
    isNew: false,
    url: "https://www.google.com/search?q=신용카드+체크카드+연말정산",
  },
  {
    id: "6",
    title: "의료비 공제 문턱 3% 기준, 이렇게 활용하세요",
    source: "한국경제",
    time: "10시간 전",
    isNew: false,
    url: "https://www.google.com/search?q=의료비+공제+3%25+기준",
  },
  {
    id: "7",
    title: "자녀세액공제 확대...다자녀 가구 최대 혜택은?",
    source: "동아일보",
    time: "12시간 전",
    isNew: false,
    url: "https://www.google.com/search?q=자녀세액공제+다자녀",
  },
  {
    id: "8",
    title: "기부금 세액공제율 인상, 나눔의 가치 더 커졌다",
    source: "매일경제",
    time: "1일 전",
    isNew: false,
    url: "https://www.google.com/search?q=기부금+세액공제율+인상",
  },
  {
    id: "9",
    title: "월세 세액공제 한도 상향, 무주택 세입자 절세 팁",
    source: "SBS뉴스",
    time: "1일 전",
    isNew: false,
    url: "https://www.google.com/search?q=월세+세액공제+한도",
  },
  {
    id: "10",
    title: "퇴직연금 IRP 납입, 연말 전 꼭 챙겨야 할 이유",
    source: "KBS뉴스",
    time: "2일 전",
    isNew: false,
    url: "https://www.google.com/search?q=퇴직연금+IRP+연말정산",
  },
];

function getUtilizationFill(rate: number): string {
  if (rate >= 90) return "bg-mint";
  if (rate >= 70) return "bg-mint";
  if (rate >= 40) return "bg-amber";
  return "bg-amber";
}

function StatusBadge({
  status,
  utilizationRate,
}: {
  status: DeductionItem["status"];
  utilizationRate?: number;
}) {
  const effectiveStatus =
    utilizationRate !== undefined
      ? utilizationRate >= 95
        ? "optimal"
        : utilizationRate >= 70
          ? "good"
          : utilizationRate >= 40
            ? "warning"
            : "critical"
      : status;

  switch (effectiveStatus) {
    case "optimal":
      return <Badge variant="success">최적</Badge>;
    case "good":
      return <Badge variant="success">양호</Badge>;
    case "warning":
      return <Badge variant="warning">개선</Badge>;
    case "critical":
      return <Badge variant="danger">미달</Badge>;
  }
}

export default function DashboardPage() {
  const [goalAmount, setGoalAmount] = useState(1200000);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<
    AIRecommendation[]
  >([]);
  const [hasUserData, setHasUserData] = useState(false);
  const [deductionItems, setDeductionItems] = useState<DeductionAnalysis[]>([]);
  const [hasAdminData, setHasAdminData] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [totalPrepaidTax, setTotalPrepaidTax] = useState(0);
  const [totalSalary, setTotalSalary] = useState(0);

  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdviceError, setAiAdviceError] = useState<string>("");
  const [showAiModal, setShowAiModal] = useState(false);

  const goalProgress = Math.min(
    100,
    Math.round((currentAmount / goalAmount) * 100),
  );
  const totalPotentialSaving = calculateTotalPotentialSaving(aiRecommendations);

  useEffect(() => {
    const loadData = async () => {
      let adminData = await loadAdminData(2026);
      if (!adminData) adminData = await loadAdminData(2025);

      if (adminData) {
        const analysis = generateDeductionAnalysis(adminData);
        setDeductionItems(analysis);
        setHasAdminData(true);

        const taxInputs = convertAdminToTaxInputs(adminData);
        const taxResult = calculateTax(taxInputs);

        const withheldTax = adminData.salary.prepaidTax || 0;
        setTotalPrepaidTax(withheldTax);
        setCurrentAmount(taxResult.refund);
        if (withheldTax > 0) setGoalAmount(withheldTax);

        const calculatedSalary =
          (adminData.salary.totalSalary || 0) +
          (adminData.salary.bonus || 0) +
          (adminData.salary.childTuition || 0);
        setTotalSalary(calculatedSalary);

        const recommendations = generateRecommendationsFromAnalysis(analysis);
        if (recommendations.length > 0) {
          setAiRecommendations(recommendations);
          setHasUserData(true);
        } else {
          setAiRecommendations(getDefaultRecommendations());
          setHasUserData(false);
        }
      } else {
        setDeductionItems(
          MOCK_DEDUCTIONS.map((d) => ({
            id: d.id,
            category: d.category,
            type: d.type,
            amount: d.amount,
            limit: d.limit,
            status: d.status,
          })),
        );
        setHasAdminData(false);
        setCurrentAmount(0);

        const taxData = await loadTaxData();
        if (taxData && taxData.salary > 0) {
          const recommendations = generateRecommendations(taxData);
          setAiRecommendations(recommendations);
          setHasUserData(true);
        } else {
          setAiRecommendations(getDefaultRecommendations());
          setHasUserData(false);
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch("/api/news");
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setNewsArticles(data.data);
        } else {
          setNewsArticles(MOCK_NEWS_ARTICLES);
        }
      } catch (error) {
        console.error("News fetch error:", error);
        setNewsArticles(MOCK_NEWS_ARTICLES);
      } finally {
        setNewsLoading(false);
      }
    }
    fetchNews();
  }, []);

  const fetchAiAdvice = async () => {
    if (!hasAdminData || deductionItems.length === 0) return;

    setShowAiModal(true);
    setAiAdviceLoading(true);
    setAiAdviceError("");

    try {
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: totalSalary,
          deductionItems: deductionItems.map((item) => ({
            category: item.category,
            type: item.type,
            amount: item.amount,
            limit: item.limit,
            status: item.status,
          })),
          currentRefund: currentAmount,
          prepaidTax: totalPrepaidTax,
        }),
      });

      const data = await response.json();

      if (response.ok && data.advice) {
        setAiAdvice(data.advice);
      } else {
        setAiAdviceError(data.error || "AI 조언 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("AI Advice Error:", error);
      setAiAdviceError("AI 조언 요청 중 오류가 발생했습니다.");
    } finally {
      setAiAdviceLoading(false);
    }
  };

  const incomeDeductTotal = deductionItems
    .filter((d) => d.type === "소득공제")
    .reduce((sum, d) => sum + d.amount, 0);
  const incomeDeductLimit = deductionItems
    .filter((d) => d.type === "소득공제")
    .reduce((sum, d) => sum + d.limit, 0);
  const taxDeductTotal = deductionItems
    .filter((d) => d.type === "세액공제")
    .reduce((sum, d) => sum + d.amount, 0);
  const taxDeductLimit = deductionItems
    .filter((d) => d.type === "세액공제")
    .reduce((sum, d) => sum + d.limit, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto">
      {/* Hero Summary Card */}
      <Card variant="raised" padding="lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Refund */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  currentAmount >= 0 ? "bg-mint" : "bg-rose",
                )}
              />
              <span className="text-caption font-semibold text-mid uppercase tracking-[0.06em]">
                2026년 예상 {currentAmount >= 0 ? "환급액" : "추가 납부액"}
              </span>
            </div>

            {hasAdminData ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={clsx(
                    "text-mono-display text-[48px] md:text-[56px] leading-[1] font-semibold",
                    currentAmount >= 0 ? "text-hi" : "text-rose",
                  )}
                >
                  {currentAmount > 0 ? "+" : currentAmount < 0 ? "-" : ""}
                  {formatKRW(Math.abs(currentAmount))}
                </span>
                <span className="text-h3 text-mid font-normal">원</span>
                {currentAmount >= 0 ? (
                  <Badge variant="success">예상 환급</Badge>
                ) : (
                  <Badge variant="danger">추가 납부 예상</Badge>
                )}
              </div>
            ) : (
              <p className="text-h3 text-dim">기초자료를 먼저 입력해주세요</p>
            )}

            {/* Progress to Goal */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-body-sm text-mid">목표 달성률</span>
                <span className="text-body-sm font-mono tabular-nums text-hi">
                  {currentAmount >= 0 ? `${goalProgress}%` : "—"}
                </span>
              </div>
              <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full transition-all duration-500 rounded-full",
                    currentAmount >= 0 ? "bg-mint" : "bg-rose",
                  )}
                  style={{
                    width: currentAmount >= 0 ? `${goalProgress}%` : "0%",
                  }}
                />
              </div>
              {currentAmount >= 0 ? (
                <p className="text-caption text-mid mt-2">
                  목표까지{" "}
                  <span className="text-hi font-mono tabular-nums">
                    {formatKRW(goalAmount - currentAmount)}원
                  </span>{" "}
                  남음
                </p>
              ) : (
                <p className="text-caption text-amber mt-2">
                  추가 공제 받을 수 있는 항목을 확인해주세요.
                </p>
              )}
            </div>
          </div>

          {/* Goal Setting */}
          <div className="border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 border-edge">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} strokeWidth={1.75} className="text-hi" />
              <h3 className="text-body-sm font-semibold text-hi">
                환급액 목표 설정
              </h3>
            </div>
            <div className="space-y-3">
              {totalPrepaidTax > 0 && (
                <p className="text-caption text-mid">
                  최대 환급 가능:{" "}
                  <span className="font-mono tabular-nums text-hi">
                    {formatKRW(totalPrepaidTax)}원
                  </span>
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setGoalAmount((prev) => Math.max(100000, prev - 100000))
                  }
                  className="w-9 h-9 rounded-md border border-edge bg-surface hover:bg-surface-2 flex items-center justify-center text-mid transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                  aria-label="목표 금액 감소"
                >
                  <ChevronDown size={16} strokeWidth={1.75} />
                </button>
                <div className="flex-1 h-9 rounded-md border border-edge bg-surface flex items-center justify-center text-mono-display text-[18px] font-semibold tabular-nums text-hi">
                  {formatKRW(goalAmount)}
                  <span className="text-caption text-mid ml-1">원</span>
                </div>
                <button
                  onClick={() => {
                    const maxGoal =
                      totalPrepaidTax > 0 ? totalPrepaidTax : Infinity;
                    setGoalAmount((prev) => Math.min(prev + 100000, maxGoal));
                  }}
                  disabled={
                    totalPrepaidTax > 0 && goalAmount >= totalPrepaidTax
                  }
                  className="w-9 h-9 rounded-md border border-edge bg-surface hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-mid transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                  aria-label="목표 금액 증가"
                >
                  <ChevronUp size={16} strokeWidth={1.75} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[800000, 1000000, 1500000].map((amount) => {
                  const isDisabled =
                    totalPrepaidTax > 0 && amount > totalPrepaidTax;
                  return (
                    <button
                      key={amount}
                      onClick={() => !isDisabled && setGoalAmount(amount)}
                      disabled={isDisabled}
                      className={clsx(
                        "h-8 rounded-md border text-caption font-mono tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint",
                        isDisabled
                          ? "border-edge bg-surface-2 text-dim cursor-not-allowed"
                          : goalAmount === amount
                            ? "border-mint bg-mint/10 text-mint font-semibold"
                            : "border-edge bg-surface text-mid hover:bg-surface-2",
                      )}
                    >
                      {formatKRW(amount)}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const optimizedAmount = currentAmount + totalPotentialSaving;
                if (optimizedAmount >= 0) {
                  return (
                    <p className="text-caption text-mid">
                      최적화 시{" "}
                      <span className="text-mint font-mono tabular-nums">
                        {formatKRW(optimizedAmount)}원
                      </span>{" "}
                      달성 가능
                    </p>
                  );
                } else {
                  return (
                    <p className="text-caption text-mid">
                      최적화 시 추가 납부{" "}
                      <span className="text-rose font-mono tabular-nums">
                        {formatKRW(Math.abs(optimizedAmount))}원
                      </span>
                      으로 감소 가능
                    </p>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* AI Deduction Analysis */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-edge">
          <div className="flex items-center gap-2">
            <Sparkles size={16} strokeWidth={1.75} className="text-hi" />
            <h3 className="text-h3 text-hi">AI 공제 항목별 분석</h3>
          </div>
          <span className="text-caption text-mid">2026년 기준</span>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em]">
                  공제 항목
                </th>
                <th className="text-center py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em] hidden sm:table-cell">
                  구분
                </th>
                <th className="text-right py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em]">
                  공제 금액
                </th>
                <th className="text-right py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em] hidden md:table-cell">
                  최대 한도
                </th>
                <th className="text-center py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em]">
                  활용률
                </th>
                <th className="text-center py-2.5 px-3 font-semibold text-caption text-mid uppercase tracking-[0.06em]">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {deductionItems.map((item) => {
                const iconMap: Record<string, React.ElementType> = {
                  "기본공제 (인적공제)": Users,
                  "4대보험": Building,
                  "신용카드 등 사용금액": CreditCard,
                  "주택자금\n(청약저축+임차차입금)": Home,
                  "주택자금\n(장기주택저당차입금이자상환)": Home,
                  월세: Home,
                  의료비: Heart,
                  교육비: GraduationCap,
                  기부금: Gift,
                  "연금저축/IRP": PiggyBank,
                  보험료: Building,
                  자녀: Users,
                };
                const Icon = iconMap[item.category] || CreditCard;
                const maxValue = item.maxBenefit || item.limit;
                const utilizationRate =
                  maxValue > 0
                    ? Math.min(100, Math.round((item.amount / maxValue) * 100))
                    : item.amount > 0
                      ? 100
                      : 0;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-2 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-md bg-surface-2 text-mid flex items-center justify-center flex-shrink-0">
                          <Icon size={14} strokeWidth={1.75} />
                        </span>
                        <span className="text-body-sm font-medium text-hi whitespace-pre-line">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3 hidden sm:table-cell">
                      <Badge
                        variant={
                          item.type === "소득공제" ? "neutral" : "outline"
                        }
                      >
                        {item.type}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-3 font-mono tabular-nums text-hi">
                      {formatKRW(Math.round(item.amount))}
                      {item.thresholdInfo && (
                        <div className="text-caption text-dim mt-0.5 whitespace-pre-line text-right font-sans">
                          {item.thresholdInfo}
                        </div>
                      )}
                    </td>
                    <td className="text-right py-3 px-3 text-mid hidden md:table-cell whitespace-pre-line">
                      {item.category === "교육비" ? (
                        <span className="text-caption">
                          본인: 한도 없음{"\n"}미취학: 1인당 3,000,000원{"\n"}
                          초중고: 1인당 3,000,000원{"\n"}대학: 1인당 9,000,000원
                        </span>
                      ) : item.category === "의료비" ? (
                        <span className="text-caption">
                          난임시술비: 한도 없음{"\n"}미숙아·선천성: 한도 없음
                          {"\n"}본인/장애/만65/6세: 한도 없음{"\n"}그 밖의
                          부양가족: 7,000,000원
                        </span>
                      ) : item.category === "기부금" && item.donationLimits ? (
                        <span className="text-caption font-mono tabular-nums">
                          정치자금:{" "}
                          {formatKRW(item.donationLimits.politicalFund)}
                          {"\n"}고향사랑/특별재난:{" "}
                          {formatKRW(item.donationLimits.hometownDisaster)}
                          {"\n"}특례기부금:{" "}
                          {formatKRW(item.donationLimits.specialDonation)}
                          {"\n"}우리사주조합:{" "}
                          {formatKRW(item.donationLimits.employeeStock)}
                          {"\n"}일반기부(종교):{" "}
                          {formatKRW(item.donationLimits.generalReligious)}
                          {"\n"}일반기부(종교 외):{" "}
                          {formatKRW(item.donationLimits.generalNonReligious)}
                        </span>
                      ) : item.category === "자녀" && item.childLimits ? (
                        <span className="text-caption font-mono tabular-nums">
                          자녀 세액공제:{"\n"}
                          1명: {formatKRW(item.childLimits.first)}
                          {"\n"}
                          2명: {formatKRW(item.childLimits.second)}
                          {"\n"}
                          3명 이상: {formatKRW(item.childLimits.thirdPlus)}
                          {"\n"}───{"\n"}
                          출생·입양:{"\n"}
                          첫째: {formatKRW(item.childLimits.birthFirst)}
                          {"\n"}
                          둘째: {formatKRW(item.childLimits.birthSecond)}
                          {"\n"}
                          셋째 이상:{" "}
                          {formatKRW(item.childLimits.birthThirdPlus)}
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums">
                          {formatKRW(item.limit)}원
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 sm:w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full",
                              getUtilizationFill(utilizationRate),
                            )}
                            style={{
                              width: `${Math.min(100, utilizationRate)}%`,
                            }}
                          />
                        </div>
                        <span className="text-caption font-mono tabular-nums text-hi w-9 text-right">
                          {utilizationRate}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3">
                      <StatusBadge
                        status={item.status}
                        utilizationRate={utilizationRate}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-md border border-edge bg-surface-2 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption font-semibold text-mid uppercase tracking-[0.06em]">
                소득공제
              </span>
              <Badge variant="neutral">과세표준 감소</Badge>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-caption text-mid">현재 공제액</p>
                <p className="text-mono-display text-[20px] font-semibold text-hi">
                  {formatKRW(incomeDeductTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-caption text-mid">최대 한도</p>
                <p className="text-body-sm font-mono tabular-nums text-mid">
                  {formatKRW(incomeDeductLimit)}
                </p>
              </div>
            </div>
            <div className="mt-3 w-full bg-surface h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky"
                style={{
                  width: `${incomeDeductLimit > 0 ? Math.round((incomeDeductTotal / incomeDeductLimit) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-md border border-edge bg-surface-2 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-caption font-semibold text-mid uppercase tracking-[0.06em]">
                세액공제
              </span>
              <Badge variant="success">납부세액 직접 감소</Badge>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-caption text-mid">현재 공제액</p>
                <p className="text-mono-display text-[20px] font-semibold text-hi">
                  {formatKRW(taxDeductTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-caption text-mid">최대 한도</p>
                <p className="text-body-sm font-mono tabular-nums text-mid">
                  {formatKRW(taxDeductLimit)}
                </p>
              </div>
            </div>
            <div className="mt-3 w-full bg-surface h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-mint"
                style={{
                  width: `${taxDeductLimit > 0 ? Math.round((taxDeductTotal / taxDeductLimit) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-caption text-mid">
          <CheckCircle2 size={14} strokeWidth={1.75} className="text-mint" />
          {deductionItems.length}개 항목 중{" "}
          <span className="font-mono tabular-nums text-hi">
            {deductionItems.filter((d) => d.status === "optimal").length}
          </span>
          개 최적화 완료
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Recommendations */}
        <Card padding="lg">
          <div className="flex items-start justify-between mb-5 pb-4 border-b border-edge gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Lightbulb size={16} strokeWidth={1.75} className="text-amber" />
              <h3 className="text-h3 text-hi">AI 절세 추천</h3>
              {hasAdminData && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchAiAdvice}
                  disabled={aiAdviceLoading}
                >
                  <Sparkles size={12} strokeWidth={1.75} />
                  {aiAdviceLoading ? "분석 중…" : "Gemini 분석 요청"}
                </Button>
              )}
            </div>
            <Badge variant="success" className="flex-shrink-0">
              <span className="font-mono tabular-nums">
                -{formatKRW(totalPotentialSaving)}원
              </span>
            </Badge>
          </div>
          <div className="space-y-3">
            {aiRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb
                  size={28}
                  strokeWidth={1.5}
                  className="mx-auto mb-2 text-dim"
                />
                <p className="text-body-sm text-mid">
                  계산기에서 데이터를 입력하면 AI 추천을 받을 수 있습니다.
                </p>
              </div>
            ) : (
              aiRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-md border border-edge bg-surface p-4 hover:border-edge-strong hover:shadow-subtle transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge type={rec.priority} />
                    {rec.potentialSaving > 0 && (
                      <span className="text-mono-display text-[18px] font-semibold text-mint">
                        -{formatKRW(rec.potentialSaving)}
                        <span className="text-caption text-mid ml-1">원</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-body-sm font-semibold text-hi leading-tight mb-1">
                    {rec.message}
                  </h4>
                  <p className="text-caption text-mid">{rec.detail}</p>
                  {rec.action && (
                    <p className="text-caption text-mint font-medium mt-2">
                      {rec.action}
                    </p>
                  )}
                </div>
              ))
            )}
            {!hasUserData && (
              <Link href="/calculator" className="block">
                <Button variant="secondary" size="md" className="w-full">
                  계산기로 이동
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* News */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-edge gap-2">
            <div className="flex items-center gap-2">
              <Bell size={16} strokeWidth={1.75} className="text-hi" />
              <h3 className="text-h3 text-hi">연말정산 뉴스</h3>
            </div>
            <button
              onClick={() => setShowAllNews(!showAllNews)}
              className="text-caption text-mid hover:text-hi transition-colors"
            >
              {showAllNews ? "접기" : "더보기"}
            </button>
          </div>
          <div className="space-y-1.5">
            {newsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={20}
                  strokeWidth={1.75}
                  className="text-hi animate-spin"
                />
                <span className="ml-3 text-body-sm text-mid">
                  뉴스를 불러오는 중…
                </span>
              </div>
            ) : newsArticles.length > 0 ? (
              <>
                {newsArticles
                  .filter((article) => {
                    const dayMatch = article.time.match(/(\d+)일/);
                    if (dayMatch) return parseInt(dayMatch[1]) <= 10;
                    return true;
                  })
                  .map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-md border border-edge bg-surface p-3 hover:bg-surface-2 hover:border-edge-strong transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {article.isNew && (
                              <Badge variant="success">NEW</Badge>
                            )}
                            <span className="text-caption text-mid">
                              {article.source}
                            </span>
                            <span className="text-caption text-dim">·</span>
                            <span className="text-caption text-mid font-mono">
                              {article.time}
                            </span>
                          </div>
                          <h4 className="text-body-sm font-medium text-hi group-hover:text-hi line-clamp-2 transition-colors">
                            {article.title}
                          </h4>
                        </div>
                        <ArrowRight
                          size={14}
                          strokeWidth={1.75}
                          className="text-dim group-hover:text-hi transition-colors flex-shrink-0 mt-1"
                        />
                      </div>
                    </a>
                  ))}

                {showAllNews &&
                  newsArticles
                    .filter((article) => {
                      const dayMatch = article.time.match(/(\d+)일/);
                      return dayMatch && parseInt(dayMatch[1]) > 10;
                    })
                    .map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md border border-edge bg-surface-2 p-3 hover:bg-surface hover:border-edge-strong transition-colors group opacity-90"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-caption text-mid">
                                {article.source}
                              </span>
                              <span className="text-caption text-dim">·</span>
                              <span className="text-caption text-mid font-mono">
                                {article.time}
                              </span>
                            </div>
                            <h4 className="text-body-sm text-mid group-hover:text-hi line-clamp-2 transition-colors">
                              {article.title}
                            </h4>
                          </div>
                          <ArrowRight
                            size={14}
                            strokeWidth={1.75}
                            className="text-dim group-hover:text-hi transition-colors flex-shrink-0 mt-1"
                          />
                        </div>
                      </a>
                    ))}
              </>
            ) : (
              <div className="text-center py-8 text-body-sm text-mid">
                뉴스를 불러올 수 없습니다.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Action */}
      <Card
        variant="raised"
        padding="lg"
        className="bg-mint text-ink border-mint"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-h3 text-ink mb-1.5">
              절세 최적화를 시작하세요
            </h3>
            <p className="text-body-sm text-ink/70">
              추천 항목을 실행하면 최대{" "}
              <span className="font-mono tabular-nums text-ink font-semibold">
                {formatKRW(totalPotentialSaving)}원
              </span>{" "}
              추가 환급 가능
            </p>
          </div>
          <Link href="/calculator" className="flex-shrink-0">
            <span className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-surface text-hi text-body-sm font-semibold hover:bg-surface/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/30">
              절세 시뮬레이션
              <ArrowRight size={14} strokeWidth={1.75} />
            </span>
          </Link>
        </div>
      </Card>

      {/* Gemini AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-base/70 backdrop-blur-sm"
            onClick={() => !aiAdviceLoading && setShowAiModal(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-surface rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-edge">
              <h3 className="text-h3 text-hi flex items-center gap-2">
                <Sparkles size={18} strokeWidth={1.75} className="text-hi" />
                Gemini AI 맞춤 절세 분석
              </h3>
              {!aiAdviceLoading && (
                <button
                  onClick={() => setShowAiModal(false)}
                  className="w-8 h-8 rounded-md hover:bg-surface-2 flex items-center justify-center text-mid hover:text-hi transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                  aria-label="모달 닫기"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {aiAdviceLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2
                    size={28}
                    strokeWidth={1.75}
                    className="text-hi animate-spin mb-4"
                  />
                  <p className="text-body font-medium text-hi">
                    Gemini AI가 분석 중입니다…
                  </p>
                  <p className="text-body-sm text-mid mt-1">
                    잠시만 기다려주세요
                  </p>
                </div>
              ) : aiAdviceError ? (
                <div className="rounded-md border border-amber/30 bg-amber/8 p-4">
                  <p className="text-body-sm text-amber flex items-center gap-2">
                    <AlertCircle size={16} strokeWidth={1.75} />
                    {aiAdviceError}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchAiAdvice}
                    className="mt-3"
                  >
                    다시 시도
                  </Button>
                </div>
              ) : aiAdvice ? (
                <div className="text-hi leading-[1.7]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ children }) => (
                        <h2 className="text-h3 text-hi mt-4 mb-2 pb-2 border-b border-edge">
                          {children}
                        </h2>
                      ),
                      h2: ({ children }) => (
                        <h3 className="text-h3 text-hi mt-4 mb-2 pb-2 border-b border-edge">
                          {children}
                        </h3>
                      ),
                      h3: ({ children }) => (
                        <h4 className="text-body font-semibold mt-4 mb-2 text-hi">
                          {children}
                        </h4>
                      ),
                      h4: ({ children }) => (
                        <h5 className="text-body-sm font-semibold mt-3 mb-1 text-hi">
                          {children}
                        </h5>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-hi">
                          {children}
                        </strong>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-body">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-3 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-3 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-body">{children}</li>
                      ),
                      code: ({ children }) => (
                        <code className="px-1 py-0.5 bg-surface-2 rounded font-mono text-[13px]">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {aiAdvice}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>

            {!aiAdviceLoading && aiAdvice && (
              <div className="p-5 bg-surface-2 border-t border-edge flex justify-end gap-2">
                <Button variant="secondary" size="md" onClick={fetchAiAdvice}>
                  다시 분석
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowAiModal(false)}
                >
                  닫기
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
