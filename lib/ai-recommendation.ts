/**
 * AI 절세 추천 서비스
 * 사용자의 세금 데이터를 분석하여 개인화된 절세 추천을 생성합니다.
 */

export interface TaxData {
    // 총급여 관련
    annualSalary: number;       // 연봉
    salary: number;             // 총급여액 (비과세 제외)
    withheldTax: number;        // 기납부세액

    // 인적공제
    dependents: number;         // 총 부양가족 수
    spouse: number;             // 배우자
    children: number;           // 자녀

    // 4대보험
    nationalPension: number;    // 국민연금
    healthInsurance: number;    // 건강보험료

    // 카드 사용
    creditCard: number;         // 신용카드
    debitCard: number;          // 체크카드
    cash: number;               // 현금영수증
    traditionalMarket: number;  // 전통시장
    publicTransport: number;    // 대중교통

    // 의료비
    medical: number;            // 의료비 합계

    // 교육비
    education: number;          // 교육비 합계

    // 주택자금
    housingSubscription: number; // 주택청약저축
    monthlyRent: number;         // 월세

    // 연금/보험
    pensionSavings: number;     // 연금저축
    irp: number;                // 퇴직연금(IRP)
    generalInsurance: number;   // 일반 보장성 보험료

    // 기부금
    politicalDonation: number;  // 정치자금 기부금
    hometownDonation: number;   // 고향사랑 기부금
    designatedDonation: number; // 일반 기부금
}

export interface AIRecommendation {
    id: string;
    priority: "high" | "medium" | "low";
    category: string;
    message: string;
    detail: string;
    potentialSaving: number;    // 예상 절세 금액 (원)
    action?: string;            // 실행 가이드
}

/**
 * 세금 데이터를 분석하여 AI 절세 추천을 생성합니다.
 */
export function generateRecommendations(data: TaxData): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    let idCounter = 1;

    // 1. 신용카드 등 사용금액 분석
    const minCardSpending = data.salary * 0.25;
    const totalCardSpending = data.creditCard + data.debitCard + data.cash + data.traditionalMarket + data.publicTransport;
    const cardUtilization = totalCardSpending / minCardSpending;

    if (cardUtilization < 1) {
        // 최소 사용금액 미달
        const shortage = minCardSpending - totalCardSpending;
        const potentialDeduction = shortage * 0.15; // 신용카드 공제율
        const potentialSaving = Math.round(potentialDeduction * 0.15); // 세율 15% 가정

        recommendations.push({
            id: String(idCounter++),
            priority: "high",
            category: "신용카드",
            message: `신용카드 ${formatWon(shortage)} 추가 사용 시 공제 시작`,
            detail: `현재 카드 사용액이 총급여의 25%인 ${formatWon(minCardSpending)}에 미달합니다. 문턱을 넘어야 공제가 시작됩니다.`,
            potentialSaving,
            action: "체크카드(30%) 또는 전통시장(40%)을 활용하면 공제율이 높습니다."
        });
    } else if (cardUtilization >= 0.95 && cardUtilization < 1.3) {
        // 문턱 근처 - 추가 사용 권장
        const additionalNeeded = minCardSpending * 0.1;
        const potentialSaving = Math.round(additionalNeeded * 0.3 * 0.15); // 체크카드 공제율

        recommendations.push({
            id: String(idCounter++),
            priority: "high",
            category: "신용카드",
            message: `체크카드/현금 ${formatWon(additionalNeeded)} 추가 사용 추천`,
            detail: `공제 문턱을 넘었습니다! 체크카드(30%)나 현금영수증(30%)을 활용하면 더 큰 공제를 받을 수 있습니다.`,
            potentialSaving,
            action: "신용카드보다 체크카드를 사용하세요."
        });
    }

    // 2. 연금저축/IRP 분석
    const pensionTotal = data.pensionSavings + data.irp;
    const pensionLimit = 9000000; // 연금저축+IRP 합산 한도
    const pensionUtilization = pensionTotal / pensionLimit;

    if (pensionUtilization < 0.5) {
        const shortage = pensionLimit - pensionTotal;
        const taxCreditRate = data.salary <= 55000000 ? 0.165 : 0.132;
        const potentialSaving = Math.round(shortage * taxCreditRate);

        recommendations.push({
            id: String(idCounter++),
            priority: "high",
            category: "연금저축",
            message: `연금저축/IRP ${formatWon(shortage)} 추가 납입 추천`,
            detail: `연간 최대 900만원까지 세액공제 가능합니다. 현재 ${Math.round(pensionUtilization * 100)}%만 활용 중입니다.`,
            potentialSaving,
            action: "IRP는 연금저축보다 납입 한도가 높습니다."
        });
    } else if (pensionUtilization < 1) {
        const shortage = pensionLimit - pensionTotal;
        const taxCreditRate = data.salary <= 55000000 ? 0.165 : 0.132;
        const potentialSaving = Math.round(shortage * taxCreditRate);

        recommendations.push({
            id: String(idCounter++),
            priority: "medium",
            category: "연금저축",
            message: `연금저축/IRP ${formatWon(shortage)} 추가 납입 가능`,
            detail: `현재 ${Math.round(pensionUtilization * 100)}% 활용 중. 한도까지 납입하면 추가 세액공제를 받을 수 있습니다.`,
            potentialSaving,
            action: "연말 전 납입하세요."
        });
    }

    // 3. 의료비 분석 (총급여 3% 초과분만 공제)
    const medicalThreshold = data.salary * 0.03;
    const medicalExcess = data.medical - medicalThreshold;

    if (data.medical > 0 && medicalExcess < 0) {
        const shortage = Math.abs(medicalExcess);
        recommendations.push({
            id: String(idCounter++),
            priority: "low",
            category: "의료비",
            message: `의료비 ${formatWon(shortage)} 추가 시 공제 시작`,
            detail: `의료비는 총급여의 3%(${formatWon(medicalThreshold)})를 초과해야 공제됩니다. 현재 ${formatWon(shortage)} 부족합니다.`,
            potentialSaving: Math.round(shortage * 0.15),
            action: "안경, 치과, 건강검진 등을 연내 진행하세요."
        });
    }

    // 4. 기부금 분석
    if (data.politicalDonation < 100000) {
        const shortage = 100000 - data.politicalDonation;
        recommendations.push({
            id: String(idCounter++),
            priority: "medium",
            category: "기부금",
            message: `정치자금 기부금 ${formatWon(shortage)} 납입으로 전액 공제`,
            detail: `정치자금 10만원까지는 전액 세액공제됩니다. 가장 효율적인 절세 방법 중 하나입니다.`,
            potentialSaving: shortage,
            action: "정당 후원금 또는 후원회 기부금"
        });
    }

    if (data.hometownDonation < 100000) {
        const shortage = 100000 - data.hometownDonation;
        recommendations.push({
            id: String(idCounter++),
            priority: "medium",
            category: "기부금",
            message: `고향사랑 기부금 ${formatWon(shortage)} 납입으로 전액 공제`,
            detail: `고향사랑 기부금 10만원까지는 전액 세액공제 + 답례품도 받을 수 있습니다.`,
            potentialSaving: shortage,
            action: "고향사랑e음 사이트에서 기부"
        });
    }

    // 5. 주택청약저축 분석
    const housingLimit = 3000000; // 연 300만원 납입한도
    if (data.housingSubscription < housingLimit) {
        const shortage = housingLimit - data.housingSubscription;
        const potentialSaving = Math.round(shortage * 0.4 * 0.15); // 40% 소득공제

        recommendations.push({
            id: String(idCounter++),
            priority: "low",
            category: "주택자금",
            message: `주택청약 ${formatWon(shortage)} 추가 납입 가능`,
            detail: `주택청약저축 납입액의 40%가 소득공제됩니다. 연 최대 300만원까지 가능합니다.`,
            potentialSaving,
            action: "무주택 세대주만 해당됩니다."
        });
    }

    // 6. 보험료 분석
    const insuranceLimit = 1000000;
    if (data.generalInsurance < insuranceLimit) {
        const shortage = insuranceLimit - data.generalInsurance;
        const potentialSaving = Math.round(shortage * 0.12); // 12% 세액공제

        recommendations.push({
            id: String(idCounter++),
            priority: "low",
            category: "보험료",
            message: `보장성보험 ${formatWon(shortage)} 추가 납입 가능`,
            detail: `보장성보험료는 연 100만원까지 12% 세액공제됩니다.`,
            potentialSaving
        });
    }

    // 우선순위순 정렬 (high > medium > low) 및 절세금액 기준 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.potentialSaving - a.potentialSaving;
    });

    return recommendations;
}

/**
 * 총 예상 절세 금액을 계산합니다.
 */
export function calculateTotalPotentialSaving(recommendations: AIRecommendation[]): number {
    return recommendations.reduce((sum, rec) => sum + rec.potentialSaving, 0);
}

/**
 * 원화 포맷팅 헬퍼
 */
function formatWon(num: number): string {
    if (num >= 10000) {
        return `${Math.round(num / 10000)}만원`;
    }
    return `${num.toLocaleString("ko-KR")}원`;
}

/**
 * 기본 추천 (데이터가 없을 경우)
 */
export function getDefaultRecommendations(): AIRecommendation[] {
    return [
        {
            id: "default-1",
            priority: "medium",
            category: "시작하기",
            message: "절세 시뮬레이션을 시작하세요",
            detail: "계산기에서 급여 및 공제 정보를 입력하면 맞춤형 절세 추천을 받을 수 있습니다.",
            potentialSaving: 0,
            action: "계산기로 이동"
        },
        {
            id: "default-2",
            priority: "low",
            category: "팁",
            message: "연금저축/IRP는 최대 900만원까지 세액공제",
            detail: "총급여 5,500만원 이하는 16.5%, 초과는 13.2% 세액공제됩니다.",
            potentialSaving: 0
        },
        {
            id: "default-3",
            priority: "low",
            category: "팁",
            message: "정치자금·고향사랑 기부금 각 10만원 전액 공제",
            detail: "가장 효율적인 절세 방법입니다. 고향사랑 기부금은 답례품도 받을 수 있습니다.",
            potentialSaving: 0
        }
    ];
}

/**
 * AdminData를 TaxData 형식으로 변환합니다.
 * AI 절세 추천에서 Admin 데이터를 사용할 수 있게 합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertAdminDataToTaxData(adminData: any): TaxData | null {
    if (!adminData || !adminData.salary) return null;

    // 월별 데이터 합산 헬퍼
    const getSpendingTotal = (category: string): number => {
        if (!adminData.spending || !adminData.spending[category]) return 0;
        return Object.values(adminData.spending[category] as Record<string, number>).reduce((sum: number, val: number) => sum + (val || 0), 0);
    };

    // 총급여 계산 (연간 합계 사용)
    const totalSalary = (adminData.salary.totalSalary || 0) +
        (adminData.salary.bonus || 0) +
        (adminData.salary.childTuition || 0);
    const mealAllowance = adminData.salary.mealAllowance || 0;
    const salary = totalSalary - mealAllowance; // 비과세 제외

    // 부양가족 수 계산
    const dependents = 1 +
        (adminData.family?.spouse ? 1 : 0) +
        (adminData.family?.children || 0) +
        (adminData.family?.parents || 0) +
        (adminData.family?.siblings || 0);

    // 주택청약저축 합산
    const housingSubscription = (adminData.deductions?.housingSubscriptionHead || 0) +
        (adminData.deductions?.housingSubscriptionSpouse || 0);

    // 의료비 합산
    const medical = (adminData.deductions?.medicalInfertility || 0) +
        (adminData.deductions?.medicalPremature || 0) +
        (adminData.deductions?.medicalDisability || 0) +
        (adminData.deductions?.medicalElderly || 0) +
        (adminData.deductions?.medicalOther || 0);

    // 교육비 합산
    const education = (adminData.deductions?.educationSelf || 0) +
        (adminData.deductions?.educationPreschool1 || 0) +
        (adminData.deductions?.educationPreschool2 || 0) +
        (adminData.deductions?.educationPreschool3 || 0) +
        (adminData.deductions?.educationK12_1 || 0) +
        (adminData.deductions?.educationK12_2 || 0) +
        (adminData.deductions?.educationK12_3 || 0) +
        (adminData.deductions?.educationUniv1 || 0) +
        (adminData.deductions?.educationUniv2 || 0) +
        (adminData.deductions?.educationUniv3 || 0);

    return {
        annualSalary: totalSalary,
        salary: salary,
        withheldTax: adminData.salary.prepaidTax || 0,

        dependents: dependents,
        spouse: adminData.family?.spouse ? 1 : 0,
        children: adminData.family?.children || 0,

        nationalPension: adminData.salary.nationalPension || 0,
        healthInsurance: adminData.salary.healthInsurance || 0,

        creditCard: getSpendingTotal("creditCard"),
        debitCard: getSpendingTotal("debitCard"),
        cash: getSpendingTotal("cash"),
        traditionalMarket: getSpendingTotal("traditionalMarket"),
        publicTransport: getSpendingTotal("publicTransport"),

        medical: medical,
        education: education,

        housingSubscription: housingSubscription,
        monthlyRent: adminData.deductions?.housingRent || 0,

        pensionSavings: adminData.deductions?.pensionSavings || 0,
        irp: adminData.deductions?.irp || 0,
        generalInsurance: adminData.deductions?.insurance || 0,

        politicalDonation: adminData.deductions?.donationPolitical || 0,
        hometownDonation: adminData.deductions?.donationHometown || 0,
        designatedDonation: adminData.deductions?.donationDesignated || 0,
    };
}

/**
 * DeductionAnalysis 인터페이스 (tax-store.ts에서 정의된 것과 동일)
 */
interface DeductionAnalysisInput {
    id: string;
    category: string;
    type: "소득공제" | "세액공제";
    amount: number;
    limit: number;
    maxBenefit?: number;
    status: "optimal" | "good" | "warning" | "critical";
    thresholdInfo?: string;
}

/**
 * AI 공제 항목별 상세 분석 결과를 기반으로 절세 추천을 생성합니다.
 * 이미 계산된 amount, limit, status 정보를 활용하여 개선 필요 항목을 식별합니다.
 */
export function generateRecommendationsFromAnalysis(
    deductionItems: DeductionAnalysisInput[]
): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    let idCounter = 1;

    for (const item of deductionItems) {
        // 이미 최적화된 항목은 건너뛰기
        if (item.status === "optimal") continue;

        // 한도가 없는 항목(인적공제, 4대보험 등)은 건너뛰기
        const maxValue = item.maxBenefit || item.limit || 0;
        if (maxValue === 0 || item.amount >= maxValue) continue;

        const shortage = maxValue - item.amount;
        const utilizationRate = maxValue > 0 ? Math.round((item.amount / maxValue) * 100) : 0;

        // 공제 유형별 절세 금액 계산
        let potentialSaving = 0;
        let priority: "high" | "medium" | "low" = "medium";
        let message = "";
        let detail = "";
        let action = "";

        // 카테고리별 추천 로직
        if (item.category.includes("신용카드")) {
            // 신용카드 등 소득공제: shortage는 추가 가능한 소득공제 금액 (이미 공제율 적용됨)
            // 기본 300만(7천↓)/250만(7천↑), 추가 300만(7천↓)/200만(7천↑)
            potentialSaving = shortage; // 이미 소득공제 금액
            priority = item.status === "critical" ? "high" : "medium";
            message = `신용카드 등 공제 ${formatWon(shortage)} 추가 가능`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 소득공제 ${formatWon(shortage)} 가능.`;
            action = "체크카드(30%), 전통시장(40%), 대중교통(40%) 공제율이 높습니다.";
        }
        else if (item.category.includes("주택자금") && item.category.includes("청약")) {
            // 주택청약: 40% 소득공제
            // shortage는 추가 가능한 소득공제 금액 (이미 40% 공제율 적용됨)
            // 추가 납입 가능 금액 = shortage / 0.4
            const additionalPayment = Math.round(shortage / 0.4);
            potentialSaving = shortage; // 이미 소득공제 금액
            priority = "low";
            message = `주택청약 ${formatWon(additionalPayment)} 추가 납입 가능`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 납입 ${formatWon(additionalPayment)} × 40% = ${formatWon(shortage)} 소득공제.`;
            action = "무주택 세대주만 해당됩니다.";
        }
        else if (item.category.includes("연금저축") || item.category.includes("IRP")) {
            // 연금저축/IRP: 16.5% 또는 13.2% 세액공제
            // shortage는 추가 세액공제 가능 금액 (maxBenefit - amount)
            // 추가 납입 가능 금액은 별도 계산 필요 (Follow-up: 미구현, dead code 제거됨)

            // 현재 amount는 세액공제액, shortage도 세액공제 차이
            // 추가 납입 가능 금액 = shortage / taxCreditRate (세액공제 공제율 역산)
            // 하지만 실제로는 12% 공제율 기준이므로 12%로 역산
            const additionalContribution = Math.round(shortage / 0.12); // 추가 납입 가능 금액

            potentialSaving = shortage; // 이미 세액공제 금액
            priority = item.status === "critical" ? "high" : "medium";
            message = `연금저축/IRP ${formatWon(additionalContribution)} 추가 납입 추천`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 납입 ${formatWon(additionalContribution)} × 12% = ${formatWon(shortage)} 세액공제.`;
            action = "연말 전 납입하세요.";
        }
        else if (item.category.includes("의료비")) {
            // 의료비: 15% 세액공제 (3% 문턱 초과분)
            // amount, shortage 모두 세액공제 금액 (이미 15% 적용됨)
            if (item.thresholdInfo?.includes("부족")) {
                // 문턱 미달인 경우 - thresholdInfo에서 부족 금액 추출
                const shortageMatch = item.thresholdInfo.match(/(\d{1,3}(,\d{3})*)/);
                const thresholdShortage = shortageMatch ? parseInt(shortageMatch[1].replace(/,/g, "")) : 0;
                potentialSaving = Math.round(thresholdShortage * 0.15);
                priority = "low";
                message = `의료비 ${formatWon(thresholdShortage)} 추가 시 공제 시작`;
                detail = `의료비는 총급여의 3%를 초과해야 공제됩니다. 현재 ${formatWon(thresholdShortage)} 부족합니다.`;
                action = "안경, 치과, 건강검진 등을 연내 진행하세요.";
            } else {
                // shortage는 세액공제 금액, 추가 지출 가능 금액 = shortage / 0.15
                const additionalSpending = Math.round(shortage / 0.15);
                potentialSaving = shortage; // 이미 세액공제 금액
                priority = "low";
                message = `의료비 추가 공제 ${formatWon(potentialSaving)} 가능`;
                detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 지출 ${formatWon(additionalSpending)} × 15% = ${formatWon(potentialSaving)} 절세 가능.`;
                action = "안경, 치과, 건강검진 등을 연내 진행하세요.";
            }
        }
        else if (item.category.includes("교육비")) {
            // 교육비: 15% 세액공제
            // shortage는 세액공제 금액, 추가 지출 가능 금액 = shortage / 0.15
            const additionalSpending = Math.round(shortage / 0.15);
            potentialSaving = shortage; // 이미 세액공제 금액
            priority = "low";
            message = `교육비 추가 공제 ${formatWon(potentialSaving)} 가능`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 지출 ${formatWon(additionalSpending)} × 15% = ${formatWon(potentialSaving)} 절세 가능.`;
        }
        else if (item.category.includes("기부금")) {
            // 기부금: 15% 또는 30% 세액공제
            // shortage는 세액공제 금액, 추가 기부 가능 금액 = shortage / 0.15
            const additionalDonation = Math.round(shortage / 0.15);
            potentialSaving = shortage; // 이미 세액공제 금액
            priority = "medium";
            message = `기부금 추가 공제 ${formatWon(potentialSaving)} 가능`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 기부 ${formatWon(additionalDonation)} × 15% = ${formatWon(potentialSaving)} 절세 가능.`;
            action = "고향사랑 기부금은 10만원까지 전액 공제 + 답례품 혜택이 있습니다.";
        }
        else if (item.category.includes("보험료")) {
            // 보험료: 12% 세액공제
            // shortage는 세액공제 금액, 추가 납입 가능 금액 = shortage / 0.12
            const additionalPremium = Math.round(shortage / 0.12);
            potentialSaving = shortage; // 이미 세액공제 금액
            priority = "low";
            message = `보장성보험 ${formatWon(additionalPremium)} 추가 납입 가능`;
            detail = `현재 ${formatWon(item.amount)} / 한도 ${formatWon(maxValue)} (${utilizationRate}% 활용). 추가 납입 ${formatWon(additionalPremium)} × 12% = ${formatWon(potentialSaving)} 세액공제.`;
        }
        else {
            // 기타 항목
            continue;
        }

        // 절세 금액이 0원 이상인 경우만 추천에 추가
        if (potentialSaving > 0) {
            recommendations.push({
                id: String(idCounter++),
                priority,
                category: item.category.replace(/\n/g, " "),
                message,
                detail,
                potentialSaving,
                action: action || undefined,
            });
        }
    }

    // 우선순위순 정렬 (high > medium > low) 및 절세금액 기준 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.potentialSaving - a.potentialSaving;
    });

    return recommendations;
}
