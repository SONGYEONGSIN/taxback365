/**
 * 세금 데이터 저장소
 * Supabase를 사용하여 Admin, Calculator, Dashboard 간 데이터 공유
 * API Route를 통해 서버에서 인증 처리 후 DB에 저장/조회
 */

import { TaxData } from "./ai-recommendation";

/**
 * Admin 페이지 데이터 인터페이스
 */
export interface AdminData {
    year: number;
    salary: {
        // 월별 데이터 (1~12월)
        monthly?: {
            [month: number]: {
                totalSalary: string;
                mealAllowance: string;
                nationalPension: string;
                healthInsurance: string;
                longTermCare: string;
                employmentInsurance: string;
                bonus: string;             // 상여금
                childTuition: string;      // 자녀학자금
                prepaidTax: string;        // 기납부세액 (소득세)
                localIncomeTax: string;    // 기납부세액 (지방소득세)
            }
        };
        // 연간 합계 (계산기로 전달용)
        totalSalary: number;       // 총급여 (세전)
        bonus: number;             // 상여금 (연간)
        childTuition: number;      // 자녀학자금 (연간)
        mealAllowance: number;     // 비과세 식대 (연간)
        childrenUnder6: number;    // 6세 이하 자녀 수 (보육수당)
        nationalPension: number;   // 국민연금
        healthInsurance: number;   // 건강보험
        longTermCare: number;      // 노인장기요양보험
        employmentInsurance: number; // 고용보험
        prepaidTax?: number;       // 기납부세액 (소득세, 연간)
        localIncomeTax?: number;   // 기납부세액 (지방소득세, 연간)
    };
    spending: {
        creditCard: number;        // 신용카드
        debitCard: number;         // 체크카드
        cash: number;              // 현금영수증
        publicTransport: number;   // 대중교통
        traditionalMarket: number; // 전통시장
        culture: number;           // 문화비
    };
    // 지출 항목 원본 (UI 복원용)
    spendingItems?: Array<{
        id: string;
        name: string;
        amount: string;
        month: number;
    }>;
    // 가족정보 (기본공제 - 본인 제외)
    family: {
        spouse: boolean;           // 배우자 유무
        children: number;          // 자녀 (만 20세 이하)
        childrenUnder6: number;    // 6세 이하 자녀 수 (보육수당 및 카드한도 확대용)
        childrenOver8?: number;    // 8세 이상 자녀 수 (자녀세액공제)
        birthAdoption?: "none" | "first" | "second" | "third1" | "third2" | "third3";  // 출생·입양자
        parents: number;           // 직계존속 (만 60세 이상)
        siblings: number;          // 형제자매 (만 20세 이하 또는 만 60세 이상)
        foster: number;            // 위탁아동 (6개월 이상)
        recipient: number;         // 기초생활수급자
        disabled?: number;         // 장애인
        seniorOver70?: number;     // 70세 이상
        singleParent?: boolean;    // 한부모
    };
    // 추가 공제 항목들
    deductions: {
        medical: number;           // 의료비 (총합, 레거시 호환)
        medicalInfertility: number;    // 의료비(난임시술비) - 30%
        medicalPremature: number;      // 의료비(미숙아,선천성) - 20%
        medicalSelf: number;           // 의료비(본인,장애,65세,6세) - 15%
        medicalFamily: number;         // 의료비(그밖부양가족) - 15%
        education: number;         // 교육비 (총합, 레거시 호환)
        educationSelf: number;     // 교육비(본인)
        educationChild: number;    // 교육비(미취학·초중고) - 레거시
        // 자녀별 교육비 (1인당 300만원 한도)
        educationPreschool1: number;  // 교육비(미취학)-자녀1
        educationPreschool2: number;  // 교육비(미취학)-자녀2
        educationPreschool3: number;  // 교육비(미취학)-자녀3
        educationK12_1: number;       // 교육비(초중고)-자녀1
        educationK12_2: number;       // 교육비(초중고)-자녀2
        educationK12_3: number;       // 교육비(초중고)-자녀3
        // 자녀별 대학 교육비 (1인당 900만원 한도)
        educationUniv: number;        // 교육비(대학) - 레거시
        educationUniv1: number;       // 교육비(대학)-자녀1
        educationUniv2: number;       // 교육비(대학)-자녀2
        educationUniv3: number;       // 교육비(대학)-자녀3
        housing: number;           // 주택마련저축 (레거시, 청약저축으로 이관)
        housingSubscription: number;  // 주택자금(청약저축) - 소득공제 (합계)
        housingSubscriptionHead: number;  // 주택자금(청약저축) - 세대주
        housingSubscriptionSpouse: number;  // 주택자금(청약저축) - 배우자
        housingRent: number;          // 주택자금(월세) - 세액공제
        housingLoan: number;          // 주택자금(임차차입금원리금상환액) - 소득공제
        housingMortgage: number;      // 주택자금(장기주택) - 소득공제 (레거시 호환)
        housingMortgage15Fixed: number;    // 장기주택 15년이상 고정금리+비거치식 (한도 1,800만원)
        housingMortgage15Either: number;   // 장기주택 15년이상 고정금리 or 비거치식 (한도 1,500만원)
        housingMortgage15Other: number;    // 장기주택 15년이상 기타 (한도 500만원)
        housingMortgage10Either: number;   // 장기주택 10년이상 고정금리 or 비거치식 (한도 300만원)
        pension: number;           // 연금저축/IRP (레거시 호환)
        pensionSavings: number;    // 연금저축 (연 600만원 한도)
        pensionIRP: number;        // 퇴직연금(IRP) (연금저축 포함 연 900만원 한도)
        insurance: number;         // 보험료
        donation: number;          // 기부금 (총합, 레거시 호환)
        donationPolitical: number;     // 기부금(정치자금)
        donationHometown: number;      // 기부금(고향사랑)
        donationDisaster: number;      // 기부금(고향사랑특별재난)
        donationSpecial: number;       // 기부금(특례기부금)
        donationStock: number;         // 기부금(우리사주조합)
        donationReligious: number;     // 기부금(일반기부금(종교))
        donationNonReligious: number;  // 기부금(일반기부금(종교 외))
    };
    updatedAt: string;
}

/**
 * 공제 항목 분석 결과 인터페이스
 */
export interface DeductionAnalysis {
    id: string;
    category: string;
    type: "소득공제" | "세액공제";
    amount: number;
    limit: number;
    maxBenefit?: number; // 최대 공제 혜택 (활용률 계산용)
    earnedIncome?: number; // 근로소득금액 (기부금 한도 계산용)
    donationLimits?: {
        politicalFund: number;        // 정치자금: 근로소득금액 전액
        hometownDisaster: number;     // 고향사랑/특별재난: 합산 200만원
        specialDonation: number;      // 특례기부금: 근로소득금액 전액
        employeeStock: number;        // 우리사주조합: 근로소득금액의 30%
        generalReligious: number;     // 일반기부금(종교): 근로소득금액의 10%
        generalNonReligious: number;  // 일반기부금(종교외): 근로소득금액의 30%
    };
    childLimits?: {
        first: number;           // 첫째: 15만원
        second: number;          // 둘째: 15만원
        thirdPlus: number;       // 셋째 이상: 30만원
        birthFirst: number;      // 출생·입양 첫째: 30만원
        birthSecond: number;     // 출생·입양 둘째: 50만원
        birthThirdPlus: number;  // 출생·입양 셋째 이상: 70만원
    };
    status: "optimal" | "good" | "warning" | "critical";
    thresholdInfo?: string; // 문턱 정보 (신용카드 25%, 의료비 3% 등)
}

/**
 * 세금 데이터 저장 (Supabase)
 */
export async function saveTaxData(data: TaxData): Promise<void> {
    try {
        const response = await fetch("/api/tax-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
        });
        if (!response.ok) {
            console.error("Failed to save tax data:", await response.text());
        }
    } catch (error) {
        console.error("Failed to save tax data:", error);
    }
}

/**
 * 세금 데이터 불러오기 (Supabase)
 */
export async function loadTaxData(): Promise<TaxData | null> {
    try {
        const response = await fetch("/api/tax-data");
        if (!response.ok) return null;
        const result = await response.json();
        return result.data || null;
    } catch (error) {
        console.error("Failed to load tax data:", error);
        return null;
    }
}

/**
 * 세금 데이터 삭제
 */
export async function clearTaxData(): Promise<void> {
    try {
        await fetch("/api/tax-data", { method: "DELETE" });
    } catch (error) {
        console.error("Failed to clear tax data:", error);
    }
}

/**
 * 세금 데이터 존재 여부 확인
 */
export async function hasTaxData(): Promise<boolean> {
    try {
        const data = await loadTaxData();
        return data !== null;
    } catch {
        return false;
    }
}

// ==================== Admin 데이터 함수 ====================

/**
 * Admin 데이터 저장 (연도별, Supabase)
 */
export async function saveAdminData(year: number, data: AdminData): Promise<void> {
    try {
        console.log("[DEBUG] saveAdminData called for year:", year);
        const response = await fetch("/api/admin-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year, data }),
        });
        if (!response.ok) {
            console.error("[ERROR] Failed to save admin data:", await response.text());
        } else {
            console.log("[DEBUG] Admin data saved successfully!");
        }
    } catch (error) {
        console.error("[ERROR] Failed to save admin data:", error);
    }
}

/**
 * Admin 데이터 불러오기 (연도별, Supabase)
 */
export async function loadAdminData(year: number): Promise<AdminData | null> {
    try {
        const response = await fetch(`/api/admin-data?year=${year}`);
        if (!response.ok) return null;
        const result = await response.json();
        return result.data || null;
    } catch (error) {
        console.error("Failed to load admin data:", error);
        return null;
    }
}

/**
 * Admin 데이터 존재 여부 확인 (연도별)
 */
export async function hasAdminData(year: number): Promise<boolean> {
    try {
        const data = await loadAdminData(year);
        return data !== null;
    } catch {
        return false;
    }
}

/**
 * Admin 데이터를 공제 분석 항목으로 변환
 */
export function generateDeductionAnalysis(adminData: AdminData): DeductionAnalysis[] {
    // 총급여액 = 급여(totalSalary) + 상여금(bonus) + 자녀학자금(childTuition) - 비과세(mealAllowance + 보육수당)
    const childcareAllowance = (adminData.salary.childrenUnder6 || 0) * 200000 * 12; // 6세 이하 자녀당 월 20만원
    const totalNonTaxable = (adminData.salary.mealAllowance || 0) + childcareAllowance;
    const salary = (adminData.salary.totalSalary || 0) +
        (adminData.salary.bonus || 0) +
        (adminData.salary.childTuition || 0) -
        totalNonTaxable;
    const spending = adminData.spending;
    const deductions = adminData.deductions;

    // spendingItems에서 직접 금액을 계산하는 헬퍼 (레거시 데이터 호환용)
    const getSpendingItemAmount = (name: string): number => {
        if (!adminData.spendingItems) return 0;
        return adminData.spendingItems
            .filter(i => i.name && i.name.includes(name))
            .reduce((sum, item) => {
                const amount = typeof item.amount === 'string'
                    ? parseInt(item.amount.replace(/[^0-9]/g, '')) || 0
                    : item.amount || 0;
                return sum + amount;
            }, 0);
    };

    // 신용카드 등 소득공제 계산
    const totalCardSpending = spending.creditCard + spending.debitCard + spending.cash +
        spending.publicTransport + spending.traditionalMarket + spending.culture;
    const minSpending = salary * 0.25; // 25% 문턱

    // 실제 공제액 계산 (25% 문턱 초과분에 공제율 적용)
    let cardDeduction = 0;
    if (totalCardSpending > minSpending) {
        let remaining = minSpending;

        // 25% 문턱 소진 순서: 신용카드 → 직불카드 → 현금영수증 → 대중교통 → 전통시장 → 문화비
        // 1. 신용카드 (15%)
        const creditUsed = Math.min(spending.creditCard, remaining);
        remaining -= creditUsed;
        const creditExcess = spending.creditCard - creditUsed;
        cardDeduction += creditExcess * 0.15;

        // 2. 직불카드 (30%)
        const debitUsed = Math.min(spending.debitCard, remaining);
        remaining -= debitUsed;
        const debitExcess = spending.debitCard - debitUsed;
        cardDeduction += debitExcess * 0.30;

        // 3. 현금영수증 (30%)
        const cashUsed = Math.min(spending.cash, remaining);
        remaining -= cashUsed;
        const cashExcess = spending.cash - cashUsed;
        cardDeduction += cashExcess * 0.30;

        // 4. 대중교통 (40%)
        const transportUsed = Math.min(spending.publicTransport, remaining);
        remaining -= transportUsed;
        const transportExcess = spending.publicTransport - transportUsed;
        cardDeduction += transportExcess * 0.40;

        // 5. 전통시장 (40%)
        const marketUsed = Math.min(spending.traditionalMarket, remaining);
        remaining -= marketUsed;
        const marketExcess = spending.traditionalMarket - marketUsed;
        cardDeduction += marketExcess * 0.40;

        // 6. 문화비 (30%)
        const cultureUsed = Math.min(spending.culture, remaining);
        remaining -= cultureUsed;
        const cultureExcess = spending.culture - cultureUsed;
        cardDeduction += cultureExcess * 0.30;
    }

    // 카드 사용 상태: 문턱 대비 얼마나 사용했는지
    const cardProgress = minSpending > 0 ? totalCardSpending / minSpending : 0;
    const getCardStatus = (): "optimal" | "good" | "warning" | "critical" => {
        if (cardProgress >= 1.3) return "optimal"; // 문턱 초과 + 여유
        if (cardProgress >= 1.0) return "good";    // 문턱 도달
        if (cardProgress >= 0.7) return "warning"; // 문턱 근접
        return "critical";                          // 문턱까지 멀음
    };

    const getStatus = (ratio: number): "optimal" | "good" | "warning" | "critical" => {
        if (ratio >= 0.95) return "optimal";
        if (ratio >= 0.7) return "good";
        if (ratio >= 0.4) return "warning";
        return "critical";
    };

    // 카드공제 한도: 기본 600만 + 자녀시 100만 (최대)
    const hasChildren = adminData.family?.children >= 1;
    const cardLimit = hasChildren ? 7000000 : 6000000;

    // 한도 적용
    const finalCardDeduction = Math.min(cardDeduction, cardLimit);


    // 인적공제 (부양가족 수)
    const dependents = 1 +
        (adminData.family?.spouse ? 1 : 0) +
        (adminData.family?.children || 0) +
        (adminData.family?.parents || 0) +
        (adminData.family?.siblings || 0) +
        (adminData.family?.foster || 0) +
        (adminData.family?.recipient || 0);
    const personalDeduction = dependents * 1500000;

    // 근로소득금액 계산 (총급여 - 근로소득공제)
    let incomeDeduction = 0;
    if (salary <= 5000000) {
        incomeDeduction = salary * 0.7;
    } else if (salary <= 15000000) {
        incomeDeduction = 3500000 + (salary - 5000000) * 0.4;
    } else if (salary <= 45000000) {
        incomeDeduction = 7500000 + (salary - 15000000) * 0.15;
    } else if (salary <= 100000000) {
        incomeDeduction = 12000000 + (salary - 45000000) * 0.05;
    } else {
        incomeDeduction = 14750000 + (salary - 100000000) * 0.02;
    }
    const earnedIncome = Math.round(salary - incomeDeduction); // 근로소득금액


    const items: DeductionAnalysis[] = [
        {
            id: "0",
            category: "기본공제 (인적공제)",
            type: "소득공제",
            amount: personalDeduction,
            limit: personalDeduction,  // 한도 없음, 부양가족 수에 따라 결정
            status: "optimal",
            thresholdInfo: `부양가족 ${dependents}명 × 150만원`,
        },
        (() => {
            // 4대보험 상세 내역
            const nationalPension = adminData.salary.nationalPension || 0;
            const healthInsurance = adminData.salary.healthInsurance || 0;
            const longTermCare = adminData.salary.longTermCare || 0;
            const employmentInsurance = adminData.salary.employmentInsurance || 0;
            const total = nationalPension + healthInsurance + longTermCare + employmentInsurance;

            const infoLines: string[] = [];
            infoLines.push(`국민연금: ${nationalPension.toLocaleString("ko-KR")}원`);
            infoLines.push(`건강보험: ${healthInsurance.toLocaleString("ko-KR")}원`);
            infoLines.push(`요양보험: ${longTermCare.toLocaleString("ko-KR")}원`);
            infoLines.push(`고용보험: ${employmentInsurance.toLocaleString("ko-KR")}원`);
            infoLines.push(`──────────────`);
            infoLines.push(`합계: ${total.toLocaleString("ko-KR")}원`);

            return {
                id: "0-1",
                category: "4대보험",
                type: "소득공제" as const,
                amount: total,
                limit: total,    // 전액 공제, 한도 없음
                status: "optimal" as const,
                thresholdInfo: infoLines.join("\n"),
            };
        })(),
        {
            id: "1",
            category: "신용카드 등 사용금액",
            type: "소득공제",
            amount: finalCardDeduction,                    // 25% 초과분에 공제율 적용한 실제 공제액
            limit: cardLimit,                             // 기본 600만 + 자녀 100만 = 최대 700만원
            status: getCardStatus(),
            thresholdInfo: `25% 문턱: ${Math.round(minSpending).toLocaleString("ko-KR")}원\n지출: ${totalCardSpending.toLocaleString("ko-KR")}원\n초과분: ${Math.max(0, totalCardSpending - Math.round(minSpending)).toLocaleString("ko-KR")}원`,
        },
        (() => {
            // 주택자금 - 청약저축 + 임차차입금원리금상환액
            // 청약저축: 납입한도 300만원
            // 임차차입금: 원리금상환액
            // 공제율: 40%, 공제한도: 400만원 (최종 공제액 기준)

            // 청약저축 데이터 (세대주/배우자)
            const headAmount = deductions.housingSubscriptionHead ?? getSpendingItemAmount("주택자금(청약저축) - 세대주");
            const spouseAmount = deductions.housingSubscriptionSpouse ?? getSpendingItemAmount("주택자금(청약저축) - 배우자");
            const subscriptionTotal = headAmount + spouseAmount;

            // 청약저축 납입한도 300만원 적용
            const limitedSubscription = Math.min(subscriptionTotal, 3000000);

            // 임차차입금원리금상환액
            const loanAmount = deductions.housingLoan || 0;

            // 합산액 (청약저축 한도 적용 후 + 임차차입금)
            const combinedTotal = limitedSubscription + loanAmount;

            // 공제액 계산: 합산액 × 40%
            const calculatedDeduction = Math.round(combinedTotal * 0.4);

            // 공제한도 400만원 적용 (최종 공제액 기준)
            const finalDeduction = Math.min(calculatedDeduction, 4000000);

            // thresholdInfo 생성 - 연금저축/IRP와 동일한 형식
            const infoLines: string[] = [];

            // 청약저축 계산식 (항상 표시)
            if (subscriptionTotal > 3000000) {
                infoLines.push(`청약저축: ${subscriptionTotal.toLocaleString("ko-KR")}원`);
                infoLines.push(`→ 한도: ${limitedSubscription.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`청약저축: ${subscriptionTotal.toLocaleString("ko-KR")}원`);
            }
            const subscriptionDeduction = Math.round(limitedSubscription * 0.4);
            infoLines.push(`└ ${limitedSubscription.toLocaleString("ko-KR")} × 40%\n= ${subscriptionDeduction.toLocaleString("ko-KR")}원`);

            // 임차차입금 계산식 (항상 표시)
            infoLines.push(`임차차입금: ${loanAmount.toLocaleString("ko-KR")}원`);
            const loanDeduction = Math.round(loanAmount * 0.4);
            infoLines.push(`└ ${loanAmount.toLocaleString("ko-KR")} × 40%\n= ${loanDeduction.toLocaleString("ko-KR")}원`);

            // 합계 표시
            infoLines.push(`──────────────`);
            if (calculatedDeduction > 4000000) {
                infoLines.push(`합계: ${calculatedDeduction.toLocaleString("ko-KR")}원`);
                infoLines.push(`→ 공제한도: ${finalDeduction.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`합계: ${finalDeduction.toLocaleString("ko-KR")}원`);
            }

            return {
                id: "2",
                category: "주택자금\n(청약저축+임차차입금)",
                type: "소득공제" as const,
                amount: finalDeduction,
                limit: 4000000,
                status: getStatus(calculatedDeduction / 4000000),
                thresholdInfo: infoLines.join("\n"),
            };
        })(),
        (() => {
            // 장기주택저당차입금이자상환액 - 옵션별 한도 적용 (이자 전액 공제)
            // 15년이상 고정금리+비거치식: 2,000만원
            // 15년이상 고정금리 or 비거치식: 1,800만원
            // 15년이상 기타: 800만원
            // 10년이상 고정금리 or 비거치식: 600만원

            const mortgage15Fixed = deductions.housingMortgage15Fixed || 0;
            const mortgage15Either = deductions.housingMortgage15Either || 0;
            const mortgage15Other = deductions.housingMortgage15Other || 0;
            const mortgage10Either = deductions.housingMortgage10Either || 0;

            // 레거시 호환: 새 필드들이 모두 0일 때만 사용
            const hasNewFields = mortgage15Fixed > 0 || mortgage15Either > 0 || mortgage15Other > 0 || mortgage10Either > 0;
            const mortgageLegacy = hasNewFields ? 0 : (deductions.housingMortgage || 0);

            // 옵션별 한도 적용 (2026년 기준)
            const LIMIT_15_FIXED = 20000000;   // 2,000만원
            const LIMIT_15_EITHER = 18000000;  // 1,800만원
            const LIMIT_15_OTHER = 8000000;    // 800만원
            const LIMIT_10_EITHER = 6000000;   // 600만원

            const limited15Fixed = Math.min(mortgage15Fixed, LIMIT_15_FIXED);
            const limited15Either = Math.min(mortgage15Either, LIMIT_15_EITHER);
            const limited15Other = Math.min(mortgage15Other, LIMIT_15_OTHER);
            const limited10Either = Math.min(mortgage10Either, LIMIT_10_EITHER);

            // 총 공제액 (이자 전액 공제이므로 한도 적용 금액 = 공제액)
            const totalDeduction = limited15Fixed + limited15Either + limited15Other + limited10Either + mortgageLegacy;
            const maxLimit = LIMIT_15_FIXED;  // 최대 한도 표시용

            // thresholdInfo 생성 - 청약저축+임차차입금과 동일한 형식
            const infoLines: string[] = [];

            // 15년↑ 고정+비거치 (한도 2,000만원)
            if (mortgage15Fixed > 0) {
                if (mortgage15Fixed > LIMIT_15_FIXED) {
                    infoLines.push(`15년↑ 고정+비거치: ${mortgage15Fixed.toLocaleString("ko-KR")}원`);
                    infoLines.push(`→ 한도: ${limited15Fixed.toLocaleString("ko-KR")}원`);
                } else {
                    infoLines.push(`15년↑ 고정+비거치: ${mortgage15Fixed.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`└ ${limited15Fixed.toLocaleString("ko-KR")} × 100%\n= ${limited15Fixed.toLocaleString("ko-KR")}원`);
            }

            // 15년↑ 고정or비거치 (한도 1,800만원)
            if (mortgage15Either > 0) {
                if (mortgage15Either > LIMIT_15_EITHER) {
                    infoLines.push(`15년↑ 고정or비거치: ${mortgage15Either.toLocaleString("ko-KR")}원`);
                    infoLines.push(`→ 한도: ${limited15Either.toLocaleString("ko-KR")}원`);
                } else {
                    infoLines.push(`15년↑ 고정or비거치: ${mortgage15Either.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`└ ${limited15Either.toLocaleString("ko-KR")} × 100%\n= ${limited15Either.toLocaleString("ko-KR")}원`);
            }

            // 15년↑ 기타 (한도 800만원)
            if (mortgage15Other > 0) {
                if (mortgage15Other > LIMIT_15_OTHER) {
                    infoLines.push(`15년↑ 기타: ${mortgage15Other.toLocaleString("ko-KR")}원`);
                    infoLines.push(`→ 한도: ${limited15Other.toLocaleString("ko-KR")}원`);
                } else {
                    infoLines.push(`15년↑ 기타: ${mortgage15Other.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`└ ${limited15Other.toLocaleString("ko-KR")} × 100%\n= ${limited15Other.toLocaleString("ko-KR")}원`);
            }

            // 10년↑ 고정or비거치 (한도 600만원)
            if (mortgage10Either > 0) {
                if (mortgage10Either > LIMIT_10_EITHER) {
                    infoLines.push(`10년↑ 고정or비거치: ${mortgage10Either.toLocaleString("ko-KR")}원`);
                    infoLines.push(`→ 한도: ${limited10Either.toLocaleString("ko-KR")}원`);
                } else {
                    infoLines.push(`10년↑ 고정or비거치: ${mortgage10Either.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`└ ${limited10Either.toLocaleString("ko-KR")} × 100%\n= ${limited10Either.toLocaleString("ko-KR")}원`);
            }

            // 합계 표시
            if (infoLines.length > 0) {
                infoLines.push(`──────────────`);
                infoLines.push(`합계: ${totalDeduction.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`지출 내역 없음`);
            }

            return {
                id: "2-2",
                category: "주택자금\n(장기주택저당차입금이자상환)",
                type: "소득공제" as const,
                amount: totalDeduction,
                limit: maxLimit,
                status: getStatus(totalDeduction / maxLimit),
                thresholdInfo: infoLines.join("\n"),
            };
        })(),
        (() => {
            // 월세 세액공제 - 급여에 따라 공제율 결정
            const rentAmount = deductions.housingRent || 0;
            const rentRate = salary <= 55000000 ? 0.17 : 0.15;
            const rentRatePercent = salary <= 55000000 ? "17%" : "15%";
            const limitedRent = Math.min(rentAmount, 10000000);
            const rentCredit = Math.round(limitedRent * rentRate);

            // thresholdInfo 생성 - 기부금처럼 세부 계산식 표시
            const infoLines: string[] = [];
            infoLines.push(`총급여: ${salary.toLocaleString("ko-KR")}원`);
            infoLines.push(`→ ${salary <= 55000000 ? "5,500만원 이하" : "5,500만원 초과"}`);
            infoLines.push(`──────────────`);
            infoLines.push(`지출: ${rentAmount.toLocaleString("ko-KR")}원`);
            if (rentAmount > 10000000) {
                infoLines.push(`한도: ${(10000000).toLocaleString("ko-KR")}원`);
            }
            infoLines.push(`└ ${limitedRent.toLocaleString("ko-KR")} × ${rentRatePercent}`);
            infoLines.push(`= ${rentCredit.toLocaleString("ko-KR")}원`);

            return {
                id: "2-3",
                category: "월세",
                type: "세액공제" as const,
                amount: rentCredit,
                limit: 10000000,
                status: getStatus(rentAmount / 10000000),
                thresholdInfo: infoLines.join("\n"),
                maxBenefit: 10000000 * rentRate,
                rentLimitInfo: {
                    salary: salary,
                    limit: 10000000,
                    rate: rentRate,
                    ratePercent: rentRatePercent,
                    isLowIncome: salary <= 55000000,
                },
            };
        })(),
        (() => {
            // 의료비 계산 및 계산식 생성
            const infertility = deductions.medicalInfertility || 0;  // 난임시술비: 30%
            const premature = deductions.medicalPremature || 0;      // 미숙아,선천성: 20%
            const selfMedical = deductions.medicalSelf || 0;         // 본인,장애,65세,6세: 15%
            const familyMedical = deductions.medicalFamily || 0;     // 그밖부양가족: 15%

            // 총 의료비 (레거시 호환 포함)
            const totalMedical = infertility + premature + selfMedical + familyMedical + (deductions.medical || 0);

            // 3% 문턱
            const threshold = Math.round(salary * 0.03);

            // 각 카테고리별 세액공제액 계산 (3% 문턱은 전체에 적용)
            // 실제로는 그밖부양가족만 700만원 한도 적용
            const FAMILY_LIMIT = 7000000;
            const familyLimited = Math.min(familyMedical, FAMILY_LIMIT);

            const infertilityCredit = Math.round(infertility * 0.30);
            const prematureCredit = Math.round(premature * 0.20);
            const selfCredit = Math.round(selfMedical * 0.15);
            const familyCredit = Math.round(familyLimited * 0.15);

            // thresholdInfo 생성 - 각 카테고리별 계산식 표시
            const infoLines: string[] = [];

            // 3% 문턱 정보 추가 (신용카드와 동일한 형식)
            infoLines.push(`3% 문턱: ${threshold.toLocaleString("ko-KR")}원`);
            infoLines.push(`지출: ${totalMedical.toLocaleString("ko-KR")}원`);
            infoLines.push(`초과분: ${Math.max(0, totalMedical - threshold).toLocaleString("ko-KR")}원`);
            infoLines.push(`──────────────`);

            // 난임시술비
            infoLines.push(`난임시술비: ${infertility.toLocaleString("ko-KR")}원`);
            infoLines.push(`└ ${infertility.toLocaleString("ko-KR")} × 30%\n= ${infertilityCredit.toLocaleString("ko-KR")}원`);

            // 미숙아,선천성
            infoLines.push(`미숙아·선천성: ${premature.toLocaleString("ko-KR")}원`);
            infoLines.push(`└ ${premature.toLocaleString("ko-KR")} × 20%\n= ${prematureCredit.toLocaleString("ko-KR")}원`);

            // 본인,장애,65세,6세
            infoLines.push(`본인/장애/만65/6세: ${selfMedical.toLocaleString("ko-KR")}원`);
            infoLines.push(`└ ${selfMedical.toLocaleString("ko-KR")} × 15%\n= ${selfCredit.toLocaleString("ko-KR")}원`);

            // 그밖부양가족 (700만원 한도)
            if (familyMedical > FAMILY_LIMIT) {
                infoLines.push(`그 밖의 부양가족: ${familyMedical.toLocaleString("ko-KR")}원`);
                infoLines.push(`→ 한도: ${FAMILY_LIMIT.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`그 밖의 부양가족: ${familyMedical.toLocaleString("ko-KR")}원`);
            }
            infoLines.push(`└ ${familyLimited.toLocaleString("ko-KR")} × 15%\n= ${familyCredit.toLocaleString("ko-KR")}원`);

            // 합계
            const totalCreditSum = infertilityCredit + prematureCredit + selfCredit + familyCredit;
            infoLines.push(`──────────────`);
            infoLines.push(`합계: ${totalCreditSum.toLocaleString("ko-KR")}원`);

            return {
                id: "3",
                category: "의료비",
                type: "세액공제" as const,
                amount: totalCreditSum,
                limit: FAMILY_LIMIT,
                status: getStatus(totalMedical / 10000000),
                thresholdInfo: infoLines.join("\n"),
                maxBenefit: FAMILY_LIMIT * 0.15,
            };
        })(),
        (() => {
            // 교육비 계산 및 계산식 생성
            const eduSelf = deductions.educationSelf || 0;      // 본인: 한도 없음

            // 자녀별 교육비 (1인당 300만원 한도)
            const pre1 = deductions.educationPreschool1 || 0;
            const pre2 = deductions.educationPreschool2 || 0;
            const pre3 = deductions.educationPreschool3 || 0;
            const k12_1 = deductions.educationK12_1 || 0;
            const k12_2 = deductions.educationK12_2 || 0;
            const k12_3 = deductions.educationK12_3 || 0;

            // 자녀별 대학 교육비 (1인당 900만원 한도)
            const univ1 = deductions.educationUniv1 || 0;
            const univ2 = deductions.educationUniv2 || 0;
            const univ3 = deductions.educationUniv3 || 0;

            // 한도 적용
            const CHILD_LIMIT = 3000000;      // 미취학·초중고: 1인당 300만원
            const UNIV_LIMIT = 9000000;       // 대학: 1인당 900만원

            const eduSelfLimited = eduSelf; // 본인은 한도 없음
            const pre1Limited = Math.min(pre1, CHILD_LIMIT);
            const pre2Limited = Math.min(pre2, CHILD_LIMIT);
            const pre3Limited = Math.min(pre3, CHILD_LIMIT);
            const k12_1Limited = Math.min(k12_1, CHILD_LIMIT);
            const k12_2Limited = Math.min(k12_2, CHILD_LIMIT);
            const k12_3Limited = Math.min(k12_3, CHILD_LIMIT);
            const univ1Limited = Math.min(univ1, UNIV_LIMIT);
            const univ2Limited = Math.min(univ2, UNIV_LIMIT);
            const univ3Limited = Math.min(univ3, UNIV_LIMIT);

            // 세액공제액 계산 (15%)
            const eduSelfCredit = Math.round(eduSelfLimited * 0.15);
            const pre1Credit = Math.round(pre1Limited * 0.15);
            const pre2Credit = Math.round(pre2Limited * 0.15);
            const pre3Credit = Math.round(pre3Limited * 0.15);
            const k12_1Credit = Math.round(k12_1Limited * 0.15);
            const k12_2Credit = Math.round(k12_2Limited * 0.15);
            const k12_3Credit = Math.round(k12_3Limited * 0.15);
            const univ1Credit = Math.round(univ1Limited * 0.15);
            const univ2Credit = Math.round(univ2Limited * 0.15);
            const univ3Credit = Math.round(univ3Limited * 0.15);

            const totalCredit = eduSelfCredit + pre1Credit + pre2Credit + pre3Credit +
                k12_1Credit + k12_2Credit + k12_3Credit + univ1Credit + univ2Credit + univ3Credit;

            // thresholdInfo 생성 - 금액이 있는 항목만 계산식과 함께 표시
            const infoLines: string[] = [];

            // 헬퍼 함수: 교육비 계산식 추가
            const addEduInfo = (label: string, amount: number, limit: number, limited: number, credit: number) => {
                if (amount > 0) {
                    if (amount > limit) {
                        infoLines.push(`${label}: ${amount.toLocaleString("ko-KR")}원`);
                        infoLines.push(`→ 한도: ${limited.toLocaleString("ko-KR")}원`);
                    } else {
                        infoLines.push(`${label}: ${amount.toLocaleString("ko-KR")}원`);
                    }
                    infoLines.push(`└ ${limited.toLocaleString("ko-KR")} × 15%\n= ${credit.toLocaleString("ko-KR")}원`);
                }
            };

            if (eduSelf > 0) {
                infoLines.push(`본인: ${eduSelf.toLocaleString("ko-KR")}원`);
                infoLines.push(`└ ${eduSelf.toLocaleString("ko-KR")} × 15%\n= ${eduSelfCredit.toLocaleString("ko-KR")}원`);
            }

            addEduInfo("미취학-자녀1", pre1, CHILD_LIMIT, pre1Limited, pre1Credit);
            addEduInfo("미취학-자녀2", pre2, CHILD_LIMIT, pre2Limited, pre2Credit);
            addEduInfo("미취학-자녀3", pre3, CHILD_LIMIT, pre3Limited, pre3Credit);
            addEduInfo("초중고-자녀1", k12_1, CHILD_LIMIT, k12_1Limited, k12_1Credit);
            addEduInfo("초중고-자녀2", k12_2, CHILD_LIMIT, k12_2Limited, k12_2Credit);
            addEduInfo("초중고-자녀3", k12_3, CHILD_LIMIT, k12_3Limited, k12_3Credit);
            addEduInfo("대학-자녀1", univ1, UNIV_LIMIT, univ1Limited, univ1Credit);
            addEduInfo("대학-자녀2", univ2, UNIV_LIMIT, univ2Limited, univ2Credit);
            addEduInfo("대학-자녀3", univ3, UNIV_LIMIT, univ3Limited, univ3Credit);

            if (infoLines.length > 0) {
                infoLines.push(`──────────────`);
                infoLines.push(`합계: ${totalCredit.toLocaleString("ko-KR")}원`);
            }

            const totalEducation = eduSelf + pre1 + pre2 + pre3 + k12_1 + k12_2 + k12_3 + univ1 + univ2 + univ3;

            return {
                id: "4",
                category: "교육비",
                type: "세액공제" as const,
                amount: totalCredit,
                limit: 9000000,  // 대학 기준 최대 한도
                status: getStatus(totalEducation > 0 ? Math.min(totalEducation / 9000000, 1) : 0),
                thresholdInfo: infoLines.length > 0 ? infoLines.join("\n") : "본인: 한도 없음\n미취학: 1인당 3,000,000원\n초중고: 1인당 3,000,000원\n대학: 1인당 9,000,000원",
                maxBenefit: 9000000 * 0.15,
            };
        })(),
        (() => {
            // 정치자금 계산 및 계산식 생성 (한도: 근로소득금액)
            const politicalRaw = deductions.donationPolitical || 0;
            const politicalLimit = earnedIncome; // 정치자금 한도 = 근로소득금액
            const political = Math.min(politicalRaw, politicalLimit); // 한도 적용
            const isLimited = politicalRaw > politicalLimit;
            let politicalCredit = 0;
            let politicalFormula = "";
            if (political > 0) {
                if (political <= 100000) {
                    politicalCredit = Math.round(political * 100 / 110);
                    politicalFormula = `└ ${political.toLocaleString("ko-KR")} × 100/110\n= ${politicalCredit.toLocaleString("ko-KR")}원`;
                } else if (political <= 30000000) {
                    const baseCredit = Math.round(100000 * 100 / 110);
                    const excessCredit = Math.round((political - 100000) * 0.15);
                    politicalCredit = baseCredit + excessCredit;
                    politicalFormula = `└ 10만원 이하: 100,000 × 100/110\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 10만원 초과: ${(political - 100000).toLocaleString("ko-KR")} × 15%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(100000 * 100 / 110);
                    const midCredit = Math.round(29900000 * 0.15);
                    const highCredit = Math.round((political - 30000000) * 0.25);
                    politicalCredit = baseCredit + midCredit + highCredit;
                    politicalFormula = `└ 10만원 이하: 100,000 × 100/110\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 10만원~3천만원: 29,900,000 × 15%\n= ${midCredit.toLocaleString("ko-KR")}원\n└ 3천만원 초과: ${(political - 30000000).toLocaleString("ko-KR")} × 25%\n= ${highCredit.toLocaleString("ko-KR")}원`;
                }
            }


            // 고향사랑 계산 및 계산식 생성
            const hometown = deductions.donationHometown || 0;
            let hometownCredit = 0;
            let hometownFormula = "";
            if (hometown > 0) {
                if (hometown <= 100000) {
                    hometownCredit = Math.round(hometown * 100 / 110);
                    hometownFormula = `└ ${hometown.toLocaleString("ko-KR")} × 100/110\n= ${hometownCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(100000 * 100 / 110);
                    const excessCredit = Math.round((hometown - 100000) * 0.15);
                    hometownCredit = baseCredit + excessCredit;
                    hometownFormula = `└ 10만원 이하: 100,000 × 100/110\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 10만원 초과: ${(hometown - 100000).toLocaleString("ko-KR")} × 15%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            // 고향사랑특별재난 계산 및 계산식 생성
            const disaster = deductions.donationDisaster || 0;
            let disasterCredit = 0;
            let disasterFormula = "";
            if (disaster > 0) {
                if (disaster <= 100000) {
                    disasterCredit = Math.round(disaster * 100 / 110);
                    disasterFormula = `└ ${disaster.toLocaleString("ko-KR")} × 100/110\n= ${disasterCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(100000 * 100 / 110);
                    const excessCredit = Math.round((disaster - 100000) * 0.3);
                    disasterCredit = baseCredit + excessCredit;
                    disasterFormula = `└ 10만원 이하: 100,000 × 100/110\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 10만원 초과: ${(disaster - 100000).toLocaleString("ko-KR")} × 30%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            // 특례기부금 계산 및 계산식 생성
            const special = deductions.donationSpecial || 0;
            let specialCredit = 0;
            let specialFormula = "";
            if (special > 0) {
                if (special <= 10000000) {
                    specialCredit = Math.round(special * 0.15);
                    specialFormula = `└ ${special.toLocaleString("ko-KR")} × 15%\n= ${specialCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(10000000 * 0.15);
                    const excessCredit = Math.round((special - 10000000) * 0.3);
                    specialCredit = baseCredit + excessCredit;
                    specialFormula = `└ 1천만원 이하: 10,000,000 × 15%\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 1천만원 초과: ${(special - 10000000).toLocaleString("ko-KR")} × 30%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            // 우리사주조합 계산 및 계산식 생성
            const stock = deductions.donationStock || 0;
            let stockCredit = 0;
            let stockFormula = "";
            if (stock > 0) {
                if (stock <= 10000000) {
                    stockCredit = Math.round(stock * 0.15);
                    stockFormula = `└ ${stock.toLocaleString("ko-KR")} × 15%\n= ${stockCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(10000000 * 0.15);
                    const excessCredit = Math.round((stock - 10000000) * 0.3);
                    stockCredit = baseCredit + excessCredit;
                    stockFormula = `└ 1천만원 이하: 10,000,000 × 15%\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 1천만원 초과: ${(stock - 10000000).toLocaleString("ko-KR")} × 30%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            // 일반기부금(종교) 계산 및 계산식 생성
            const religious = deductions.donationReligious || 0;
            let religiousCredit = 0;
            let religiousFormula = "";
            if (religious > 0) {
                if (religious <= 10000000) {
                    religiousCredit = Math.round(religious * 0.15);
                    religiousFormula = `└ ${religious.toLocaleString("ko-KR")} × 15%\n= ${religiousCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(10000000 * 0.15);
                    const excessCredit = Math.round((religious - 10000000) * 0.3);
                    religiousCredit = baseCredit + excessCredit;
                    religiousFormula = `└ 1천만원 이하: 10,000,000 × 15%\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 1천만원 초과: ${(religious - 10000000).toLocaleString("ko-KR")} × 30%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            // 일반기부금(종교 외) 계산 및 계산식 생성
            const nonReligious = deductions.donationNonReligious || 0;
            let nonReligiousCredit = 0;
            let nonReligiousFormula = "";
            if (nonReligious > 0) {
                if (nonReligious <= 10000000) {
                    nonReligiousCredit = Math.round(nonReligious * 0.15);
                    nonReligiousFormula = `└ ${nonReligious.toLocaleString("ko-KR")} × 15%\n= ${nonReligiousCredit.toLocaleString("ko-KR")}원`;
                } else {
                    const baseCredit = Math.round(10000000 * 0.15);
                    const excessCredit = Math.round((nonReligious - 10000000) * 0.3);
                    nonReligiousCredit = baseCredit + excessCredit;
                    nonReligiousFormula = `└ 1천만원 이하: 10,000,000 × 15%\n= ${baseCredit.toLocaleString("ko-KR")}원\n└ 1천만원 초과: ${(nonReligious - 10000000).toLocaleString("ko-KR")} × 30%\n= ${excessCredit.toLocaleString("ko-KR")}원`;
                }
            }

            const totalCredit = politicalCredit + hometownCredit + disasterCredit + specialCredit + stockCredit + religiousCredit + nonReligiousCredit;

            // thresholdInfo 생성 - 금액이 있는 항목만 계산식과 함께 표시
            const infoLines: string[] = [];
            if (political > 0) {
                if (isLimited) {
                    infoLines.push(`정치자금: ${politicalRaw.toLocaleString("ko-KR")}원`);
                    infoLines.push(`→ 한도: ${political.toLocaleString("ko-KR")}원`);
                } else {
                    infoLines.push(`정치자금: ${political.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(politicalFormula);
            }
            if (hometown > 0) {
                infoLines.push(`고향사랑: ${hometown.toLocaleString("ko-KR")}원`);
                infoLines.push(hometownFormula);
            }
            if (disaster > 0) {
                infoLines.push(`특별재난: ${disaster.toLocaleString("ko-KR")}원`);
                infoLines.push(disasterFormula);
            }
            if (special > 0) {
                infoLines.push(`특례기부금: ${special.toLocaleString("ko-KR")}원`);
                infoLines.push(specialFormula);
            }
            if (stock > 0) {
                infoLines.push(`우리사주: ${stock.toLocaleString("ko-KR")}원`);
                infoLines.push(stockFormula);
            }
            if (religious > 0) {
                infoLines.push(`종교기부: ${religious.toLocaleString("ko-KR")}원`);
                infoLines.push(religiousFormula);
            }
            if (nonReligious > 0) {
                infoLines.push(`일반기부: ${nonReligious.toLocaleString("ko-KR")}원`);
                infoLines.push(nonReligiousFormula);
            }
            if (infoLines.length > 0) {
                infoLines.push(`──────────────`);
                infoLines.push(`합계: ${totalCredit.toLocaleString("ko-KR")}원`);
            }

            return {
                id: "5",
                category: "기부금",
                type: "세액공제" as const,
                amount: totalCredit,
                limit: earnedIncome,
                status: getStatus(Math.min(1, (political + hometown + disaster + special + stock + religious + nonReligious) / earnedIncome)),
                thresholdInfo: infoLines.length > 0 ? infoLines.join("\n") : "기부금 내역이 없습니다",
                maxBenefit: earnedIncome * 0.3,
                earnedIncome: earnedIncome,
                donationLimits: {
                    politicalFund: earnedIncome,
                    hometownDisaster: 2000000,
                    specialDonation: earnedIncome,
                    employeeStock: Math.round(earnedIncome * 0.3),
                    generalReligious: Math.round(earnedIncome * 0.1),
                    generalNonReligious: Math.round(earnedIncome * 0.3),
                },
            };
        })(),
        (() => {
            // 연금저축/IRP 계산 및 계산식 생성
            // 레거시 호환: pensionSavings가 없으면 pension 필드 사용
            const savingsAmount = deductions?.pensionSavings || deductions?.pension || 0;
            const irpAmount = deductions?.pensionIRP || 0;

            // 한도 적용
            const SAVINGS_LIMIT = 6000000; // 연금저축: 600만원
            const TOTAL_LIMIT = 9000000;   // 연금저축+IRP 합산: 900만원

            const savingsLimited = Math.min(savingsAmount, SAVINGS_LIMIT);
            const remainingLimit = Math.max(0, TOTAL_LIMIT - savingsLimited);
            const irpLimited = Math.min(irpAmount, remainingLimit);

            // 세액공제액 계산 (12%)
            const savingsCredit = Math.round(savingsLimited * 0.12);
            const irpCredit = Math.round(irpLimited * 0.12);
            const totalCredit = savingsCredit + irpCredit;

            // thresholdInfo 생성 - 연금저축과 IRP 각각 계산식 표시 (0원이어도 표시)
            const infoLines: string[] = [];

            // 연금저축 계산식 (항상 표시)
            if (savingsAmount > SAVINGS_LIMIT) {
                infoLines.push(`연금저축: ${savingsAmount.toLocaleString("ko-KR")}원`);
                infoLines.push(`→ 한도: ${savingsLimited.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`연금저축: ${savingsAmount.toLocaleString("ko-KR")}원`);
            }
            infoLines.push(`└ ${savingsLimited.toLocaleString("ko-KR")} × 12%\n= ${savingsCredit.toLocaleString("ko-KR")}원`);

            // 퇴직연금(IRP) 계산식 (항상 표시)
            if (irpAmount > remainingLimit && remainingLimit > 0) {
                infoLines.push(`퇴직연금(IRP): ${irpAmount.toLocaleString("ko-KR")}원`);
                infoLines.push(`→ 한도: ${irpLimited.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`퇴직연금(IRP): ${irpAmount.toLocaleString("ko-KR")}원`);
            }
            infoLines.push(`└ ${irpLimited.toLocaleString("ko-KR")} × 12%\n= ${irpCredit.toLocaleString("ko-KR")}원`);

            // 합계 표시
            infoLines.push(`──────────────`);
            infoLines.push(`합계: ${totalCredit.toLocaleString("ko-KR")}원`);

            const totalAmount = savingsAmount + irpAmount;

            return {
                id: "6",
                category: "연금저축/IRP",
                type: "세액공제" as const,
                amount: totalCredit,
                limit: TOTAL_LIMIT,
                status: getStatus(totalAmount / TOTAL_LIMIT),
                thresholdInfo: infoLines.join("\n"),
                maxBenefit: TOTAL_LIMIT * 0.12,
            };
        })(),
        (() => {
            // 보험료 계산 및 계산식 생성
            const insuranceAmount = deductions.insurance || 0;
            const INSURANCE_LIMIT = 1000000; // 한도: 100만원
            const limitedAmount = Math.min(insuranceAmount, INSURANCE_LIMIT);
            const taxCredit = Math.round(limitedAmount * 0.12); // 12% 세액공제

            // thresholdInfo 생성
            const infoLines: string[] = [];
            if (insuranceAmount > 0) {
                infoLines.push(`납입액: ${insuranceAmount.toLocaleString("ko-KR")}원`);
                if (insuranceAmount > INSURANCE_LIMIT) {
                    infoLines.push(`→ 한도: ${INSURANCE_LIMIT.toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`└ ${limitedAmount.toLocaleString("ko-KR")} × 12%\n= ${taxCredit.toLocaleString("ko-KR")}원`);
            }

            return {
                id: "7",
                category: "보험료",
                type: "세액공제" as const,
                amount: taxCredit,
                limit: INSURANCE_LIMIT,
                status: getStatus(insuranceAmount / INSURANCE_LIMIT),
                thresholdInfo: infoLines.length > 0 ? infoLines.join("\n") : "보장성 보험: 연 100만원 한도\n세액공제율: 12%",
                maxBenefit: INSURANCE_LIMIT * 0.12,
            };
        })(),
        (() => {
            // 자녀 세액공제 계산 및 계산식 생성
            const childrenOver8 = adminData.family?.childrenOver8 || 0;
            const birthAdoption = adminData.family?.birthAdoption || "none";

            // 자녀 세액공제 (만 8세 이상)
            // 1명: 25만원
            // 2명: 55만원
            // 3명 이상: 55만원 + (추가 인원 × 40만원)
            let childCredit = 0;
            if (childrenOver8 === 1) {
                childCredit = 250000; // 1명
            } else if (childrenOver8 === 2) {
                childCredit = 550000; // 2명
            } else if (childrenOver8 >= 3) {
                childCredit = 550000 + (childrenOver8 - 2) * 400000; // 3명 이상
            }

            // 출생·입양 공제
            let birthAdoptionCredit = 0;
            let birthAdoptionName = "";
            switch (birthAdoption) {
                case "first":
                    birthAdoptionCredit = 300000;
                    birthAdoptionName = "첫째";
                    break;
                case "second":
                    birthAdoptionCredit = 500000;
                    birthAdoptionName = "둘째";
                    break;
                case "third1":
                    birthAdoptionCredit = 700000;
                    birthAdoptionName = "셋째 이상 1명";
                    break;
                case "third2":
                    birthAdoptionCredit = 1400000;
                    birthAdoptionName = "셋째 이상 2명";
                    break;
                case "third3":
                    birthAdoptionCredit = 2100000;
                    birthAdoptionName = "셋째 이상 3명";
                    break;
            }

            const totalCredit = childCredit + birthAdoptionCredit;

            // thresholdInfo 생성 - 계산식 표시
            const infoLines: string[] = [];

            // 자녀 세액공제 계산식
            infoLines.push(`자녀 세액공제 (만 8세 이상 ${childrenOver8}명)`);
            if (childrenOver8 > 0) {
                if (childrenOver8 === 1) {
                    infoLines.push(`└ 1명: 250,000원`);
                } else if (childrenOver8 === 2) {
                    infoLines.push(`└ 2명: 550,000원`);
                } else if (childrenOver8 >= 3) {
                    const thirdPlus = childrenOver8 - 2;
                    infoLines.push(`└ 2명: 550,000원`);
                    infoLines.push(`└ 추가 ${thirdPlus}명: ${(thirdPlus * 400000).toLocaleString("ko-KR")}원`);
                }
                infoLines.push(`= ${childCredit.toLocaleString("ko-KR")}원`);
            } else {
                infoLines.push(`└ 0원`);
            }

            // 출생·입양 공제 계산식
            if (birthAdoption !== "none") {
                infoLines.push(``);
                infoLines.push(`출생·입양 공제 (${birthAdoptionName})`);
                infoLines.push(`└ ${birthAdoptionCredit.toLocaleString("ko-KR")}원`);
            }

            // 합계
            infoLines.push(`──────────────`);
            infoLines.push(`합계: ${totalCredit.toLocaleString("ko-KR")}원`);

            return {
                id: "8",
                category: "자녀",
                type: "세액공제" as const,
                amount: totalCredit,
                limit: 0, // 한도 없음
                status: childrenOver8 > 0 ? "optimal" as const : "critical" as const,
                thresholdInfo: infoLines.join("\n"),
                maxBenefit: 0, // 한도 없음
                childLimits: {
                    first: 250000,
                    second: 550000,
                    thirdPlus: 400000,
                    birthFirst: 300000,
                    birthSecond: 500000,
                    birthThirdPlus: 700000,
                },
            };
        })(),
    ];


    return items;
}
