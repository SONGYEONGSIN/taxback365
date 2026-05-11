"use client";

import { useState } from "react";
import {
  CreditCard,
  Building,
  HeartPulse,
  GraduationCap,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Calculator,
  Shield,
  Users,
  Wallet,
  Baby,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Tooltip } from "@/components/ui/Tooltip";
import { saveTaxData, loadAdminData } from "@/lib/tax-store";
import { TaxData } from "@/lib/ai-recommendation";

// 숫자 포맷 함수
function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}

// 콤마 제거 및 숫자 변환
function parseNumber(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, "")) || 0;
}

// 세금 계산 함수 (CALCULATOR_FORMULAS.md 기준 - 2026년)
function calculateTax(inputs: FormInputs) {
  const salary = inputs.salary;

  // ==========================================
  // 1. 근로소득공제 (2026년 기준)
  // ==========================================
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

  // 근로소득금액
  const earnedIncome = salary - incomeDeduction;

  // ==========================================
  // 2. 소득공제 항목
  // ==========================================

  // 인적공제 (부양가족 1인당 150만원)
  const personalDeduction = inputs.dependents * 1500000;

  // 4대보험 소득공제 (전액 공제)
  const socialInsuranceDeduction =
    inputs.nationalPension +
    inputs.healthInsurance +
    inputs.longTermCare +
    inputs.employmentInsurance;

  // 신용카드 등 소득공제 (UI와 동일한 로직)
  const threshold = salary * 0.25; // 최소 사용금액 (총급여의 25%)

  let cardDeduction = 0;

  // 순차적으로 25% 소진: 신용카드 → 직불카드 → 현금영수증 → 대중교통 → 전통시장 → 문화체육
  let cardRemaining = threshold;

  // 1. 신용카드
  const creditExcess = Math.max(0, inputs.creditCard - cardRemaining);
  cardRemaining = Math.max(0, cardRemaining - inputs.creditCard);

  // 2. 직불카드
  const debitExcess = Math.max(0, inputs.debitCard - cardRemaining);
  cardRemaining = Math.max(0, cardRemaining - inputs.debitCard);

  // 3. 현금영수증
  const cashExcess = Math.max(0, inputs.cash - cardRemaining);
  cardRemaining = Math.max(0, cardRemaining - inputs.cash);

  // 4. 대중교통
  const transportExcess = Math.max(0, inputs.publicTransport - cardRemaining);
  cardRemaining = Math.max(0, cardRemaining - inputs.publicTransport);

  // 5. 전통시장
  const marketExcess = Math.max(0, inputs.traditionalMarket - cardRemaining);
  cardRemaining = Math.max(0, cardRemaining - inputs.traditionalMarket);

  // 6. 문화체육
  const cultureExcess = Math.max(0, inputs.culture - cardRemaining);

  // 기본 공제 (신용카드, 직불카드, 현금영수증) - 초과분에만 공제율 적용
  const creditDeduction = Math.round(creditExcess * 0.15);
  const debitDeduction = Math.round(debitExcess * 0.3);
  const cashDeduction = Math.round(cashExcess * 0.3);
  const basicDeduction = creditDeduction + debitDeduction + cashDeduction;

  // 기본 공제 한도: 총급여에 따라 200~300만원 + 자녀 추가한도
  let baseLimit = 3000000;
  if (salary > 120000000) {
    baseLimit = 2000000;
  } else if (salary > 70000000) {
    baseLimit = 2500000;
  }
  baseLimit += Math.min((inputs.cardChildren || 0) * 500000, 1000000);
  const finalBasic = Math.min(basicDeduction, baseLimit);

  // 추가 공제 (대중교통, 전통시장, 문화체육) - 초과분에만 공제율 적용
  const transportDeduction = Math.round(transportExcess * 0.4);
  const marketDeduction = Math.round(marketExcess * 0.4);
  const cultureDeductionVal =
    salary <= 70000000 ? Math.round(cultureExcess * 0.3) : 0;
  const additionalDeduction =
    transportDeduction + marketDeduction + cultureDeductionVal;

  // 추가 공제 한도: 총급여에 따라 200~300만원
  let additionalLimit = 3000000;
  if (salary > 120000000) {
    additionalLimit = 2000000;
  } else if (salary > 70000000) {
    additionalLimit = 2500000;
  }
  const finalAdditional = Math.min(additionalDeduction, additionalLimit);

  cardDeduction = finalBasic + finalAdditional;

  // 주택자금 소득공제
  let housingIncomeDeduction = 0;
  // 주택청약저축: 총급여 7천만원 이하, 40%, 한도 300만원 (납입액 연간 300만원 한도)
  if (salary <= 70000000 && inputs.housingSubscription > 0) {
    housingIncomeDeduction +=
      Math.min(inputs.housingSubscription, 3000000) * 0.4;
  }
  // 주택임차차입금 원리금상환액: 40%, 연간 공제 한도 400만원
  housingIncomeDeduction += Math.min(inputs.rentLoanPayment * 0.4, 4000000);
  // 장기주택저당차입금 이자상환액: 전액 공제, 300~1,800만원 한도
  housingIncomeDeduction += Math.min(inputs.mortgageInterest, 18000000);

  // 총 소득공제
  const totalIncomeDeduction =
    personalDeduction +
    socialInsuranceDeduction +
    cardDeduction +
    housingIncomeDeduction;

  // 과세표준
  let taxableIncome = earnedIncome - totalIncomeDeduction;
  taxableIncome = Math.max(0, taxableIncome);

  // ==========================================
  // 3. 산출세액 (2026년 세율)
  // ==========================================
  let calculatedTax = 0;
  if (taxableIncome <= 14000000) {
    calculatedTax = taxableIncome * 0.06;
  } else if (taxableIncome <= 50000000) {
    calculatedTax = 840000 + (taxableIncome - 14000000) * 0.15;
  } else if (taxableIncome <= 88000000) {
    calculatedTax = 6240000 + (taxableIncome - 50000000) * 0.24;
  } else if (taxableIncome <= 150000000) {
    calculatedTax = 15360000 + (taxableIncome - 88000000) * 0.35;
  } else if (taxableIncome <= 300000000) {
    calculatedTax = 37060000 + (taxableIncome - 150000000) * 0.38;
  } else if (taxableIncome <= 500000000) {
    calculatedTax = 94060000 + (taxableIncome - 300000000) * 0.4;
  } else if (taxableIncome <= 1000000000) {
    calculatedTax = 174060000 + (taxableIncome - 500000000) * 0.42;
  } else {
    calculatedTax = 384060000 + (taxableIncome - 1000000000) * 0.45;
  }

  // ==========================================
  // 4. 세액공제 항목
  // ==========================================

  // 의료비 세액공제 (CALCULATOR_FORMULAS.md 기준)
  // 문턱금액: 총급여의 3%
  const medicalThreshold = salary * 0.03;
  // 총 의료비 (실손보험금 차감)
  const totalMedical =
    inputs.infertility +
    inputs.premature +
    inputs.selfDisabledSenior +
    inputs.otherFamily;
  const netMedical = Math.max(0, totalMedical - inputs.insuranceReimbursement);

  let medicalDeduction = 0;
  // 문턱금액 초과분에 대해서만 공제
  const eligibleMedical = Math.max(0, netMedical - medicalThreshold);

  if (eligibleMedical > 0) {
    // 각 항목별 공제 계산 (문턱금액 초과분 비율로 배분)
    const ratio = eligibleMedical / netMedical;

    // 난임시술비 30% (한도 없음)
    medicalDeduction += inputs.infertility * ratio * 0.3;
    // 미숙아/선천성이상아 20% (한도 없음)
    medicalDeduction += inputs.premature * ratio * 0.2;
    // 본인/장애인/65세이상/6세이하 15% (한도 없음)
    medicalDeduction += inputs.selfDisabledSenior * ratio * 0.15;
    // 그 밖의 부양가족 15% (700만원 한도)
    medicalDeduction += Math.min(inputs.otherFamily * ratio, 7000000) * 0.15;
  }

  // 교육비 세액공제 (15%, 한도별 계산)
  let educationDeduction = 0;
  // 본인 교육비: 한도 없음
  educationDeduction += inputs.selfEducation * 0.15;
  // 미취학 자녀: 300만원/인 한도 (간소화를 위해 합계로 처리)
  educationDeduction += Math.min(inputs.preschool, 3000000) * 0.15;
  // 초중고: 300만원/인 한도
  educationDeduction += Math.min(inputs.elementary, 3000000) * 0.15;
  // 대학: 900만원/인 한도
  educationDeduction += Math.min(inputs.university, 9000000) * 0.15;

  // 주택자금 세액공제 (월세)
  let housingTaxCredit = 0;
  // 월세 세액공제: 총급여 5,500만원 이하 17%, 초과 15% (1,000만원 한도)
  if (inputs.monthlyRent > 0) {
    const rentRate = salary <= 55000000 ? 0.17 : 0.15;
    housingTaxCredit = Math.min(inputs.monthlyRent, 10000000) * rentRate;
  }

  // 연금계좌 세액공제 (UI와 동일한 로직 - 12% 고정)
  const pensionRate = 0.12; // 12% (지방세 제외)
  // 연금저축 한도: 600만원
  const pensionSavingsLimit = Math.min(inputs.pensionSavings, 6000000);
  // IRP 합산 한도: 900만원 (연금저축 포함)
  const irpLimit = Math.min(inputs.irp, 9000000 - pensionSavingsLimit);
  // ISA 전환금액: 10%만 공제 대상, 300만원 한도
  const isaLimit = Math.min((inputs.isaTransfer || 0) * 0.1, 3000000);

  const pensionDeduction =
    (pensionSavingsLimit + irpLimit + isaLimit) * pensionRate;

  // 보장성 보험료 세액공제
  // 일반 보장성 보험: 100만원 한도, 12%
  const generalInsuranceCredit =
    Math.min(inputs.generalInsurance, 1000000) * 0.12;
  // 장애인 전용 보험: 100만원 한도, 15%
  const disabledInsuranceCredit =
    Math.min(inputs.disabledInsurance, 1000000) * 0.15;
  const insuranceDeduction = generalInsuranceCredit + disabledInsuranceCredit;

  // 기부금 세액공제 (CALCULATOR_FORMULAS.md 기준)
  let donationDeduction = 0;

  // 정치자금: 10만원 이하 100/110, 초과 15%, 3천만원 초과 25%
  if (inputs.politicalDonation > 0) {
    const politicalBase =
      Math.min(inputs.politicalDonation, 100000) * (100 / 110);
    const politicalExcess = Math.max(0, inputs.politicalDonation - 100000);
    const politicalExcess15 = Math.min(politicalExcess, 30000000);
    const politicalExcess25 = Math.max(0, politicalExcess - 30000000);
    donationDeduction +=
      politicalBase + politicalExcess15 * 0.15 + politicalExcess25 * 0.25;
  }

  // 고향사랑: 합산 2천만원 한도, 10만원 이하 100/110, 초과 15%
  if (inputs.hometownDonation > 0) {
    const hometownLimited = Math.min(inputs.hometownDonation, 20000000);
    const hometownBase = Math.min(hometownLimited, 100000) * (100 / 110);
    const hometownExcess = Math.max(0, hometownLimited - 100000) * 0.15;
    donationDeduction += hometownBase + hometownExcess;
  }

  // 고향사랑 특별재난: 10만원 이하 100/110, 초과 30%
  if (inputs.hometownDisaster > 0) {
    const hometownLimited = Math.min(inputs.hometownDonation, 20000000);
    const disasterLimited = Math.min(
      inputs.hometownDisaster,
      Math.max(0, 20000000 - hometownLimited),
    );
    const disasterBase = Math.min(disasterLimited, 100000) * (100 / 110);
    const disasterExcess = Math.max(0, disasterLimited - 100000) * 0.3;
    donationDeduction += disasterBase + disasterExcess;
  }

  // 특례기부금: 1천만원 이하 15%, 초과 30%
  if (inputs.specialDonation > 0) {
    const special15 = Math.min(inputs.specialDonation, 10000000) * 0.15;
    const special30 = Math.max(0, inputs.specialDonation - 10000000) * 0.3;
    donationDeduction += special15 + special30;
  }

  // 우리사주조합: 소득 30% 한도
  if (inputs.employeeDonation > 0) {
    const employeeLimited = Math.min(
      inputs.employeeDonation,
      earnedIncome * 0.3,
    );
    const employee15 = Math.min(employeeLimited, 10000000) * 0.15;
    const employee30 = Math.max(0, employeeLimited - 10000000) * 0.3;
    donationDeduction += employee15 + employee30;
  }

  // 일반기부금 (종교단체 외): 소득 30% 한도
  if (inputs.designatedDonation > 0) {
    const designatedLimited = Math.min(
      inputs.designatedDonation,
      earnedIncome * 0.3,
    );
    const designated15 = Math.min(designatedLimited, 10000000) * 0.15;
    const designated30 = Math.max(0, designatedLimited - 10000000) * 0.3;
    donationDeduction += designated15 + designated30;
  }

  // 종교단체: 소득 10% 한도
  if (inputs.religiousDonation > 0) {
    const religiousLimited = Math.min(
      inputs.religiousDonation,
      earnedIncome * 0.1,
    );
    const religious15 = Math.min(religiousLimited, 10000000) * 0.15;
    const religious30 = Math.max(0, religiousLimited - 10000000) * 0.3;
    donationDeduction += religious15 + religious30;
  }

  // ==========================================
  // 5. 자녀 세액공제 (CALCULATOR_FORMULAS.md 기준)
  // ==========================================
  let childTaxCredit = 0;

  // 기본공제 대상 자녀 (만 8세 이상)
  // 1명: 25만원, 2명: 55만원, 3명 이상: 55만원 + 2명 초과 1명당 40만원
  const childrenOver8 = inputs.childrenOver8 || 0;
  if (childrenOver8 === 1) {
    childTaxCredit += 250000;
  } else if (childrenOver8 === 2) {
    childTaxCredit += 550000;
  } else if (childrenOver8 >= 3) {
    childTaxCredit += 550000 + (childrenOver8 - 2) * 400000;
  }

  // 출생·입양 공제 (첫째 30만원, 둘째 50만원, 셋째 이상 70만원)
  const birthAdoption = inputs.birthAdoption || "none";
  if (birthAdoption === "first") {
    childTaxCredit += 300000;
  } else if (birthAdoption === "second") {
    childTaxCredit += 500000;
  } else if (birthAdoption === "third1") {
    childTaxCredit += 700000;
  } else if (birthAdoption === "third2") {
    childTaxCredit += 1400000; // 셋째 이상 2명
  } else if (birthAdoption === "third3") {
    childTaxCredit += 2100000; // 셋째 이상 3명
  }

  // ==========================================
  // 6. 근로소득세액공제
  // ==========================================
  // 산출세액 130만원 이하: 산출세액 × 55%
  // 산출세액 130만원 초과: 715,000원 + (산출세액 - 130만원) × 30%
  let earnedIncomeTaxCredit = 0;
  if (calculatedTax <= 1300000) {
    earnedIncomeTaxCredit = calculatedTax * 0.55;
  } else {
    earnedIncomeTaxCredit = 715000 + (calculatedTax - 1300000) * 0.3;
  }
  // 한도 적용
  // 3,300만원 이하: 74만원
  // 3,300만원 초과 7,000만원 이하: 74만원 - (초과분 × 0.008) → 최소 66만원
  // 7,000만원 초과 1억2천만원 이하: 66만원 - (초과분 × 1/2) → 최소 50만원
  // 1억2천만원 초과: 50만원 - (초과분 × 1/2) → 최소 20만원
  let earnedIncomeTaxCreditLimit = 0;
  if (salary <= 33000000) {
    earnedIncomeTaxCreditLimit = 740000;
  } else if (salary <= 70000000) {
    earnedIncomeTaxCreditLimit = Math.max(
      660000,
      740000 - (salary - 33000000) * 0.008,
    );
  } else if (salary <= 120000000) {
    earnedIncomeTaxCreditLimit = Math.max(
      500000,
      660000 - (salary - 70000000) * 0.5,
    );
  } else {
    earnedIncomeTaxCreditLimit = Math.max(
      200000,
      500000 - (salary - 120000000) * 0.5,
    );
  }
  earnedIncomeTaxCredit = Math.min(
    earnedIncomeTaxCredit,
    earnedIncomeTaxCreditLimit,
  );

  // 총 세액공제
  const totalTaxCredit =
    earnedIncomeTaxCredit +
    medicalDeduction +
    educationDeduction +
    housingTaxCredit +
    pensionDeduction +
    insuranceDeduction +
    donationDeduction +
    childTaxCredit;

  // 결정세액
  const finalTax = Math.max(0, calculatedTax - totalTaxCredit);

  // 기납부세액 (사용자 입력값 사용)
  const withheldTax = inputs.withheldTax;

  // 환급액 또는 추가납부액
  const refund = withheldTax - finalTax;

  return {
    salary: Math.round(salary),
    earnedIncome: Math.round(earnedIncome),
    incomeDeduction: Math.round(incomeDeduction),
    totalIncomeDeduction: Math.round(totalIncomeDeduction),
    personalDeduction: Math.round(personalDeduction),
    cardDeduction: Math.round(cardDeduction),
    medicalDeduction: Math.round(medicalDeduction),
    educationDeduction: Math.round(educationDeduction),
    housingDeduction: Math.round(housingIncomeDeduction + housingTaxCredit),
    pensionDeduction: Math.round(pensionDeduction + insuranceDeduction),
    donationDeduction: Math.round(donationDeduction),
    socialInsuranceDeduction: Math.round(socialInsuranceDeduction),
    childTaxCredit: Math.round(childTaxCredit),
    earnedIncomeTaxCredit: Math.round(earnedIncomeTaxCredit),
    insuranceDeduction: Math.round(insuranceDeduction),
    taxableIncome: Math.round(taxableIncome),
    calculatedTax: Math.round(calculatedTax),
    totalTaxCredit: Math.round(totalTaxCredit),
    finalTax: Math.round(finalTax),
    withheldTax,
    refund: Math.round(refund),
  };
}

interface FormInputs {
  annualSalary: number; // 연봉 (급여 + 상여)
  mealAllowance: number; // 비과세(식대) - 연간
  childrenUnder6: number; // 6세 이하 자녀 수 (보육수당용)
  salary: number; // 총급여액 (자동 계산)
  withheldTax: number; // 기납부세액 (소득세)
  localIncomeTax: number; // 기납부세액 (지방소득세)
  // 인적공제 상세
  spouse: number; // 배우자 (0 또는 1)
  parents: number; // 직계존속 (만60세 이상)
  children: number; // 자녀 (만20세 이하)
  siblings: number; // 형제자매 (만20세 이하 또는 만60세 이상)
  foster: number; // 위탁아동 (6개월 이상)
  recipient: number; // 기초생활수급자
  dependents: number; // 총 부양가족 수 (자동 계산)
  nationalPension: number; // 국민연금
  healthInsurance: number; // 건강보험료
  longTermCare: number; // 노인장기요양보험료
  employmentInsurance: number; // 고용보험료
  // 카드 사용액
  cardChildren: number; // 카드 소득공제 자녀 수 (한도 확대용)
  creditCard: number; // 신용카드
  debitCard: number; // 직불카드
  cash: number; // 현금영수증
  traditionalMarket: number; // 전통시장
  publicTransport: number; // 대중교통
  culture: number; // 문화체육
  // 의료비
  infertility: number; // 난임시술비
  premature: number; // 미숙아·선천성이상아
  selfDisabledSenior: number; // 본인/장애인/만65세이상/6세이하
  otherFamily: number; // 그 밖의 부양가족
  insuranceReimbursement: number; // 실손의료보험금
  medical: number; // 의료비 합계 (자동 계산)
  // 교육비
  selfEducation: number; // 본인 교육비
  preschool: number; // 미취학 자녀
  elementary: number; // 초중고
  university: number; // 대학
  education: number; // 교육비 합계 (자동 계산)
  // 주택자금
  housingSubscription: number; // 주택청약저축
  rentLoanPayment: number; // 주택임차차입금 원리금상환액
  mortgageInterest: number; // 장기주택저당차입금 이자상환액
  monthlyRent: number; // 월세 세액공제
  housing: number; // 주택자금 합계 (자동 계산)
  // 연금 및 보험
  pensionSavings: number; // 연금저축
  irp: number; // 퇴직연금(IRP)
  isaTransfer: number; // ISA 만기 전환금액
  generalInsurance: number; // 일반 보장성 보험료
  disabledInsurance: number; // 장애인 전용 보장성 보험료
  pension: number; // 연금계좌 합계 (자동 계산)
  // 기부금
  politicalDonation: number; // 정치자금 기부금
  hometownDonation: number; // 고향사랑 기부금
  hometownDisaster: number; // 고향사랑 특별재난지역
  specialDonation: number; // 특례기부금
  employeeDonation: number; // 우리사주조합 기부금
  designatedDonation: number; // 일반 기부금 (종교단체 외)
  religiousDonation: number; // 종교단체 기부금
  // 자녀공제 (세액공제)
  childrenOver8: number; // 만 8세 이상 자녀 수 (자녀세액공제)
  birthAdoption: "none" | "first" | "second" | "third1" | "third2" | "third3"; // 출생·입양자
}

interface TaxResult {
  salary: number;
  earnedIncome: number;
  incomeDeduction: number;
  totalIncomeDeduction: number;
  personalDeduction: number;
  cardDeduction: number;
  medicalDeduction: number;
  educationDeduction: number;
  housingDeduction: number;
  pensionDeduction: number;
  donationDeduction: number;
  socialInsuranceDeduction: number;
  childTaxCredit: number; // 자녀 세액공제
  earnedIncomeTaxCredit: number; // 근로소득세액공제
  insuranceDeduction: number; // 보험료 세액공제
  taxableIncome: number;
  calculatedTax: number;
  totalTaxCredit: number;
  finalTax: number;
  withheldTax: number;
  refund: number;
}

export default function CalculatorPage() {
  const categories = [
    { id: "salary", label: "총급여", icon: Wallet },
    { id: "basic", label: "기본공제", icon: Users },
    { id: "insurance", label: "4대보험", icon: Shield },
    { id: "card", label: "신용카드 등 사용액", icon: CreditCard },
    { id: "medical", label: "의료비", icon: HeartPulse },
    { id: "edu", label: "교육비", icon: GraduationCap },
    { id: "house", label: "주택자금", icon: Building },
    { id: "pension", label: "연금계좌·보험", icon: Building },
    { id: "donation", label: "기부금", icon: HeartPulse },
    { id: "childTaxCredit", label: "자녀공제", icon: Baby },
  ];

  const [openSection, setOpenSection] = useState<string | null>("salary");
  const [inputs, setInputs] = useState<FormInputs>({
    annualSalary: 0, // 연봉 (급여 + 상여)
    mealAllowance: 0, // 비과세(식대) - 연간 (월 20만원 x 12)
    childrenUnder6: 0, // 6세 이하 자녀 수
    salary: 0, // 총급여액 (자동 계산됨)
    withheldTax: 0, // 기납부세액 (소득세)
    localIncomeTax: 0, // 기납부세액 (지방소득세)
    // 인적공제 상세
    spouse: 0, // 배우자 (0 또는 1)
    parents: 0, // 직계존속 (만60세 이상)
    children: 0, // 자녀 (만20세 이하)
    siblings: 0, // 형제자매
    foster: 0, // 위탁아동
    recipient: 0, // 기초생활수급자
    dependents: 1, // 총 부양가족 수 (본인1)
    nationalPension: 0, // 국민연금
    healthInsurance: 0, // 건강보험료
    longTermCare: 0, // 노인장기요양보험료
    employmentInsurance: 0, // 고용보험료
    // 카드 사용액
    cardChildren: 0, // 카드 소득공제 자녀 수
    creditCard: 0, // 신용카드
    debitCard: 0, // 직불카드
    cash: 0, // 현금영수증
    traditionalMarket: 0, // 전통시장
    publicTransport: 0, // 대중교통
    culture: 0, // 문화체육
    // 의료비
    infertility: 0, // 난임시술비
    premature: 0, // 미숙아·선천성이상아
    selfDisabledSenior: 0, // 본인/장애인/만65세이상/6세이하
    otherFamily: 0, // 그 밖의 부양가족
    insuranceReimbursement: 0, // 실손의료보험금
    medical: 0, // 의료비 합계
    // 교육비
    selfEducation: 0, // 본인 교육비
    preschool: 0, // 미취학 자녀
    elementary: 0, // 초중고
    university: 0, // 대학
    education: 0, // 교육비 합계
    // 주택자금
    housingSubscription: 0, // 주택청약저축
    rentLoanPayment: 0, // 주택임차차입금 원리금상환액
    mortgageInterest: 0, // 장기주택저당차입금 이자상환액
    monthlyRent: 0, // 월세 세액공제
    housing: 0, // 주택자금 합계
    // 연금 및 보험
    pensionSavings: 0, // 연금저축
    irp: 0, // 퇴직연금(IRP)
    isaTransfer: 0, // ISA 만기 전환금액
    generalInsurance: 0, // 일반 보장성 보험료
    disabledInsurance: 0, // 장애인 전용 보장성 보험료
    pension: 0, // 연금계좌 합계
    // 기부금
    politicalDonation: 0, // 정치자금 기부금
    hometownDonation: 0, // 고향사랑 기부금
    hometownDisaster: 0, // 고향사랑 특별재난지역
    specialDonation: 0, // 특례기부금
    employeeDonation: 0, // 우리사주조합 기부금
    designatedDonation: 0, // 일반 기부금 (종교단체 외)
    religiousDonation: 0, // 종교단체 기부금
    // 자녀공제 (세액공제)
    childrenOver8: 0, // 만 8세 이상 자녀 수
    birthAdoption: "none" as const, // 출생·입양자
  });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (
    field: keyof FormInputs,
    value: string | number,
  ) => {
    if (typeof value === "string") {
      const numValue = parseNumber(value);
      setInputs((prev) => {
        const updated = { ...prev, [field]: numValue };
        // 총급여액 자동 계산 (연봉 - 비과세 - 보육수당)
        if (
          field === "annualSalary" ||
          field === "mealAllowance" ||
          field === "childrenUnder6"
        ) {
          const annualSalary =
            field === "annualSalary" ? numValue : prev.annualSalary;
          const mealAllowance =
            field === "mealAllowance" ? numValue : prev.mealAllowance;
          const childrenUnder6 =
            field === "childrenUnder6" ? numValue : prev.childrenUnder6;
          const childcareAllowance = childrenUnder6 * 200000 * 12; // 6세이하 1인당 월 20만원
          const totalTaxExempt = mealAllowance + childcareAllowance;
          updated.salary = Math.max(0, annualSalary - totalTaxExempt);
        }
        // 인적공제 자동 계산 (본인 1 + 배우자 + 직계존속 + 자녀 + 형제자매 + 위탁아동 + 수급자)
        if (
          [
            "spouse",
            "parents",
            "children",
            "siblings",
            "foster",
            "recipient",
          ].includes(field)
        ) {
          const spouse = field === "spouse" ? numValue : prev.spouse;
          const parents = field === "parents" ? numValue : prev.parents;
          const children = field === "children" ? numValue : prev.children;
          const siblings = field === "siblings" ? numValue : prev.siblings;
          const foster = field === "foster" ? numValue : prev.foster;
          const recipient = field === "recipient" ? numValue : prev.recipient;
          updated.dependents =
            1 + spouse + parents + children + siblings + foster + recipient;
        }
        return updated;
      });
    } else {
      setInputs((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "childrenUnder6") {
          const childcareAllowance = value * 200000 * 12;
          const totalTaxExempt = prev.mealAllowance + childcareAllowance;
          updated.salary = Math.max(0, prev.annualSalary - totalTaxExempt);
        }
        // 인적공제 자동 계산
        if (
          [
            "spouse",
            "parents",
            "children",
            "siblings",
            "foster",
            "recipient",
          ].includes(field)
        ) {
          const spouse = field === "spouse" ? value : prev.spouse;
          const parents = field === "parents" ? value : prev.parents;
          const children = field === "children" ? value : prev.children;
          const siblings = field === "siblings" ? value : prev.siblings;
          const foster = field === "foster" ? value : prev.foster;
          const recipient = field === "recipient" ? value : prev.recipient;
          updated.dependents =
            1 + spouse + parents + children + siblings + foster + recipient;
        }
        return updated;
      });
    }
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    // 약간의 딜레이를 줘서 계산 중임을 시각적으로 표시
    setTimeout(async () => {
      const taxResult = calculateTax(inputs);
      setResult(taxResult);
      setIsCalculating(false);

      // AI 추천을 위해 세금 데이터 저장
      const taxData: TaxData = {
        annualSalary: inputs.annualSalary,
        salary: inputs.salary,
        withheldTax: inputs.withheldTax,
        dependents: inputs.dependents,
        spouse: inputs.spouse,
        children: inputs.children,
        nationalPension: inputs.nationalPension,
        healthInsurance: inputs.healthInsurance,
        creditCard: inputs.creditCard,
        debitCard: inputs.debitCard,
        cash: inputs.cash,
        traditionalMarket: inputs.traditionalMarket,
        publicTransport: inputs.publicTransport,
        medical: inputs.medical,
        education: inputs.education,
        housingSubscription: inputs.housingSubscription,
        monthlyRent: inputs.monthlyRent,
        pensionSavings: inputs.pensionSavings,
        irp: inputs.irp,
        generalInsurance: inputs.generalInsurance,
        politicalDonation: inputs.politicalDonation,
        hometownDonation: inputs.hometownDonation,
        designatedDonation: inputs.designatedDonation,
      };
      await saveTaxData(taxData);
    }, 500);
  };

  const [isResetting, setIsResetting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleLoadData = async () => {
    setIsLoadingData(true);

    const adminData = await loadAdminData(2026); // 2026년 기준
    console.log("[DEBUG] Admin data loaded:", adminData);
    console.log("[DEBUG] Salary data:", adminData?.salary);
    console.log("[DEBUG] totalSalary:", adminData?.salary?.totalSalary);
    console.log("[DEBUG] bonus:", adminData?.salary?.bonus);
    console.log("[DEBUG] childTuition:", adminData?.salary?.childTuition);
    console.log("[DEBUG] Family data:", adminData?.family);
    console.log("[DEBUG] childrenOver8:", adminData?.family?.childrenOver8);
    console.log("[DEBUG] birthAdoption:", adminData?.family?.birthAdoption);
    if (adminData) {
      // Admin 데이터를 Calculator inputs에 매핑
      // 연봉 = 급여 + 상여 + 자녀학자금
      const annualSalary =
        adminData.salary.totalSalary +
        (adminData.salary.bonus || 0) +
        (adminData.salary.childTuition || 0);
      // 보육수당 비과세 = 6세 이하 자녀 수 × 20만원 × 12개월
      const childcareAllowance =
        (adminData.salary.childrenUnder6 || 0) * 200000 * 12;
      // 총 비과세 = 식대 + 보육수당
      const totalNonTaxable =
        (adminData.salary.mealAllowance || 0) + childcareAllowance;
      setInputs((prev) => ({
        ...prev,
        // 급여 정보
        annualSalary: annualSalary,
        mealAllowance: adminData.salary.mealAllowance || 0,
        childrenUnder6: adminData.salary.childrenUnder6 || 0,
        salary: annualSalary - totalNonTaxable, // 연봉 - 총 비과세
        withheldTax: adminData.salary.prepaidTax || 0, // 기납부세액 (소득세)
        localIncomeTax: adminData.salary.localIncomeTax || 0, // 기납부세액 (지방소득세)
        nationalPension: adminData.salary.nationalPension,
        healthInsurance: adminData.salary.healthInsurance,
        longTermCare: adminData.salary.longTermCare || 0,
        employmentInsurance: adminData.salary.employmentInsurance || 0,
        // 카드 사용액
        creditCard: adminData.spending.creditCard,
        debitCard: adminData.spending.debitCard,
        cash: adminData.spending.cash,
        publicTransport: adminData.spending.publicTransport,
        traditionalMarket: adminData.spending.traditionalMarket || 0,
        culture: adminData.spending.culture || 0,
        // 가족정보 → 인적공제
        spouse: adminData.family?.spouse ? 1 : 0,
        children: adminData.family?.children || 0,
        parents: adminData.family?.parents || 0,
        siblings: adminData.family?.siblings || 0,
        foster: adminData.family?.foster || 0,
        recipient: adminData.family?.recipient || 0,
        // 총 부양가족 수 = 본인 1 + 배우자 + 자녀 + 직계존속 + 형제자매 + 위탁아동 + 수급자
        dependents:
          1 +
          (adminData.family?.spouse ? 1 : 0) +
          (adminData.family?.children || 0) +
          (adminData.family?.parents || 0) +
          (adminData.family?.siblings || 0) +
          (adminData.family?.foster || 0) +
          (adminData.family?.recipient || 0),
        cardChildren: adminData.family?.children || 0, // 카드공제 한도 확대용
        // 자녀공제 (세액공제)
        childrenOver8: adminData.family?.childrenOver8 || 0,
        birthAdoption: adminData.family?.birthAdoption || "none",
      }));
      setTimeout(() => setIsLoadingData(false), 300);
    } else {
      // 데이터가 없으면 알림
      setTimeout(() => {
        setIsLoadingData(false);
        alert(
          "저장된 기초자료가 없습니다. 기초자료 페이지에서 데이터를 먼저 입력해주세요.",
        );
      }, 300);
    }
  };

  const handleReset = () => {
    setIsResetting(true);
    setInputs({
      annualSalary: 0,
      mealAllowance: 0,
      childrenUnder6: 0,
      salary: 0,
      withheldTax: 0,
      localIncomeTax: 0,
      spouse: 0,
      parents: 0,
      children: 0,
      siblings: 0,
      foster: 0,
      recipient: 0,
      dependents: 1,
      nationalPension: 0,
      healthInsurance: 0,
      longTermCare: 0,
      employmentInsurance: 0,
      cardChildren: 0,
      creditCard: 0,
      debitCard: 0,
      cash: 0,
      traditionalMarket: 0,
      publicTransport: 0,
      culture: 0,
      infertility: 0,
      premature: 0,
      selfDisabledSenior: 0,
      otherFamily: 0,
      insuranceReimbursement: 0,
      medical: 0,
      selfEducation: 0,
      preschool: 0,
      elementary: 0,
      university: 0,
      education: 0,
      housingSubscription: 0,
      rentLoanPayment: 0,
      mortgageInterest: 0,
      monthlyRent: 0,
      housing: 0,
      pensionSavings: 0,
      irp: 0,
      isaTransfer: 0,
      generalInsurance: 0,
      disabledInsurance: 0,
      pension: 0,
      politicalDonation: 0,
      hometownDonation: 0,
      hometownDisaster: 0,
      specialDonation: 0,
      employeeDonation: 0,
      designatedDonation: 0,
      religiousDonation: 0,
      childrenOver8: 0,
      birthAdoption: "none" as const,
    });
    setResult(null);
    setTimeout(() => setIsResetting(false), 300);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 text-foreground">계산기</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLoadData}
              className={clsx(
                "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md border border-neutral-200 bg-card text-foreground text-[13px] font-medium transition-colors hover:bg-neutral-100 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50",
                isLoadingData && "bg-primary/5 border-primary text-primary",
              )}
            >
              <Download
                size={14}
                className={isLoadingData ? "animate-bounce" : ""}
              />{" "}
              기초자료 동기화
            </button>
            <button
              onClick={handleReset}
              className={clsx(
                "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50",
                isResetting
                  ? "bg-warning/10 border border-warning/30 text-warning"
                  : "bg-foreground text-card hover:bg-primary-700",
              )}
            >
              <RefreshCw
                size={14}
                className={isResetting ? "animate-spin" : ""}
              />{" "}
              초기화
            </button>
          </div>
        </div>

        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-lg border border-neutral-200 bg-card overflow-hidden"
          >
            <button
              onClick={() =>
                setOpenSection(openSection === cat.id ? null : cat.id)
              }
              className={clsx(
                "w-full flex items-center justify-between p-4 text-body font-semibold transition-colors",
                openSection === cat.id
                  ? "bg-neutral-50 text-foreground border-l-2 border-primary"
                  : "text-neutral-700 hover:bg-neutral-50",
              )}
            >
              <div className="flex items-center gap-3">
                <cat.icon size={20} strokeWidth={2.5} />
                {cat.label}
              </div>
              {openSection === cat.id ? (
                <ChevronUp size={24} />
              ) : (
                <ChevronDown size={24} />
              )}
            </button>

            <AnimatePresence>
              {openSection === cat.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: "visible" }}
                >
                  <div className="p-6 border-t-[3px] border-black space-y-6 bg-white">
                    {/* 총급여 */}
                    {cat.id === "salary" && (
                      <>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            연봉 (급여 + 상여)
                            <Tooltip content="연간 총 급여와 상여의 합계 금액입니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.annualSalary)}
                            onChange={(e) =>
                              handleInputChange("annualSalary", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            비과세 (식대) - 연간
                            <Tooltip content="월 20만원 한도의 식대 비과세 금액입니다. 연간 총액을 입력하세요.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.mealAllowance)}
                            onChange={(e) =>
                              handleInputChange("mealAllowance", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            6세 이하 자녀 수 (보육수당용)
                            <Tooltip content="6세 이하 자녀 1인당 월 20만원(연 240만원)의 보육수당이 비과세로 적용됩니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <div className="flex gap-2">
                            {[0, 1, 2, 3].map((num) => (
                              <button
                                key={num}
                                onClick={() =>
                                  handleInputChange("childrenUnder6", num)
                                }
                                className={clsx(
                                  "flex-1 py-2 border-2 border-black font-bold transition-colors",
                                  inputs.childrenUnder6 === num
                                    ? "bg-black text-white"
                                    : "bg-white hover:bg-gray-100",
                                )}
                              >
                                {num}명
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            <p>
                              식대 비과세: {formatNumber(inputs.mealAllowance)}
                              원
                            </p>
                            <p>
                              보육수당 비과세: {inputs.childrenUnder6}명 ×
                              20만원 × 12개월 ={" "}
                              {formatNumber(
                                inputs.childrenUnder6 * 200000 * 12,
                              )}
                              원
                            </p>
                            <p className="border-t border-black pt-1">
                              총 비과세:{" "}
                              {formatNumber(
                                inputs.mealAllowance +
                                  inputs.childrenUnder6 * 200000 * 12,
                              )}
                              원
                            </p>
                          </div>
                        </div>
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">총급여액 (자동 계산)</p>
                          <p className="text-2xl font-black">
                            {formatNumber(inputs.salary)}원
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            연봉 - 총 비과세 ={" "}
                            {formatNumber(inputs.annualSalary)} -{" "}
                            {formatNumber(
                              inputs.mealAllowance +
                                inputs.childrenUnder6 * 200000 * 12,
                            )}
                          </p>
                        </div>

                        {/* 기납부세액 */}
                        <div className="space-y-4 border-t-2 border-black pt-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            💳 기납부세액
                          </h4>
                          <div className="space-y-2">
                            <label className="font-bold flex items-center gap-2">
                              기납부세액 (소득세) (원)
                              <Tooltip content="근로소득 원천징수영수증의 '결정세액' 또는 매월 급여명세서의 소득세 합계">
                                <Info
                                  size={14}
                                  className="text-gray-400 cursor-help"
                                />
                              </Tooltip>
                            </label>
                            <input
                              type="text"
                              className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                              value={formatNumber(inputs.withheldTax)}
                              onChange={(e) =>
                                handleInputChange("withheldTax", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="font-bold flex items-center gap-2">
                              기납부세액 (지방소득세) (원)
                              <Tooltip content="매월 급여명세서의 지방소득세 합계 (소득세의 10%)">
                                <Info
                                  size={14}
                                  className="text-gray-400 cursor-help"
                                />
                              </Tooltip>
                            </label>
                            <input
                              type="text"
                              className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                              value={formatNumber(inputs.localIncomeTax || 0)}
                              onChange={(e) =>
                                handleInputChange(
                                  "localIncomeTax",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* 기본공제 */}
                    {cat.id === "basic" && (
                      <>
                        {/* 본인/배우자 공제 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            기본공제 (본인/배우자)
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold text-sm h-6 flex items-center">
                                본인공제
                              </label>
                              <div className="w-full h-11 rounded-md border border-neutral-200 bg-neutral-100 px-3.5 flex items-center justify-end text-body text-neutral-500 font-mono tabular-nums cursor-not-allowed">
                                1,500,000
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm h-6">
                                배우자공제
                                <Tooltip content="근로소득자: 연봉 500만원 이하 / 다른소득자: 소득금액 100만원 이하">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <div className="flex gap-2">
                                {[0, 1].map((num) => (
                                  <button
                                    key={num}
                                    onClick={() =>
                                      handleInputChange("spouse", num)
                                    }
                                    className={clsx(
                                      "flex-1 h-11 rounded-md border border-neutral-200 text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600",
                                      inputs.spouse === num
                                        ? "bg-black text-white"
                                        : "bg-white hover:bg-gray-100",
                                    )}
                                  >
                                    {num === 0 ? "없음" : "있음"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 부양가족공제 */}
                        <div className="space-y-4 border-t-2 border-gray-200 pt-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            부양가족공제 (1인당 150만원)
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm">
                                직계존속 (인)
                                <Tooltip content="부모, 장인/장모 등 만60세 이상">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.parents}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    parents: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                    dependents:
                                      1 +
                                      prev.spouse +
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0,
                                      ) +
                                      prev.children +
                                      prev.siblings +
                                      prev.foster +
                                      prev.recipient,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm">
                                자녀 (인)
                                <Tooltip content="만20세 이하 자녀">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.children}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    children: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                    dependents:
                                      1 +
                                      prev.spouse +
                                      prev.parents +
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0,
                                      ) +
                                      prev.siblings +
                                      prev.foster +
                                      prev.recipient,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm">
                                형제자매 (인)
                                <Tooltip content="만20세 이하 또는 만60세 이상">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.siblings}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    siblings: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                    dependents:
                                      1 +
                                      prev.spouse +
                                      prev.parents +
                                      prev.children +
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0,
                                      ) +
                                      prev.foster +
                                      prev.recipient,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm">
                                위탁아동 (인)
                                <Tooltip content="6개월 이상 위탁양육">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.foster}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    foster: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                    dependents:
                                      1 +
                                      prev.spouse +
                                      prev.parents +
                                      prev.children +
                                      prev.siblings +
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0,
                                      ) +
                                      prev.recipient,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2 text-sm">
                                수급자 (인)
                                <Tooltip content="기초생활수급자">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.recipient}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    recipient: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                    dependents:
                                      1 +
                                      prev.spouse +
                                      prev.parents +
                                      prev.children +
                                      prev.siblings +
                                      prev.foster +
                                      Math.max(
                                        0,
                                        parseInt(e.target.value) || 0,
                                      ),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            <p>본인: 1명 × 150만원 = 1,500,000원</p>
                            {inputs.spouse > 0 && (
                              <p>
                                배우자: {inputs.spouse}명 × 150만원 ={" "}
                                {formatNumber(inputs.spouse * 1500000)}원
                              </p>
                            )}
                            {inputs.parents > 0 && (
                              <p>
                                직계존속: {inputs.parents}명 × 150만원 ={" "}
                                {formatNumber(inputs.parents * 1500000)}원
                              </p>
                            )}
                            {inputs.children > 0 && (
                              <p>
                                자녀: {inputs.children}명 × 150만원 ={" "}
                                {formatNumber(inputs.children * 1500000)}원
                              </p>
                            )}
                            {inputs.siblings > 0 && (
                              <p>
                                형제자매: {inputs.siblings}명 × 150만원 ={" "}
                                {formatNumber(inputs.siblings * 1500000)}원
                              </p>
                            )}
                            {inputs.foster > 0 && (
                              <p>
                                위탁아동: {inputs.foster}명 × 150만원 ={" "}
                                {formatNumber(inputs.foster * 1500000)}원
                              </p>
                            )}
                            {inputs.recipient > 0 && (
                              <p>
                                수급자: {inputs.recipient}명 × 150만원 ={" "}
                                {formatNumber(inputs.recipient * 1500000)}원
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 인적공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">
                            인적공제 합계 (자동 계산)
                          </p>
                          <p className="text-2xl font-black">
                            {formatNumber(inputs.dependents * 1500000)}원
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            총 {inputs.dependents}명 (본인 1 + 배우자{" "}
                            {inputs.spouse} + 직계존속 {inputs.parents} + 자녀{" "}
                            {inputs.children} + 형제자매 {inputs.siblings} +
                            위탁아동 {inputs.foster} + 수급자 {inputs.recipient}
                            )
                          </p>
                        </div>
                      </>
                    )}

                    {/* 4대보험 */}
                    {cat.id === "insurance" && (
                      <>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            국민연금 (원)
                            <Tooltip content="급여에서 공제된 연간 국민연금 납입액입니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.nationalPension)}
                            onChange={(e) =>
                              handleInputChange(
                                "nationalPension",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            건강보험료 (원)
                            <Tooltip content="급여에서 공제된 연간 건강보험료입니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.healthInsurance)}
                            onChange={(e) =>
                              handleInputChange(
                                "healthInsurance",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            노인장기요양보험료 (원)
                            <Tooltip content="건강보험료와 함께 납부하는 장기요양보험료입니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.longTermCare)}
                            onChange={(e) =>
                              handleInputChange("longTermCare", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold flex items-center gap-2">
                            고용보험료 (원)
                            <Tooltip content="급여에서 공제된 연간 고용보험료입니다.">
                              <Info
                                size={16}
                                className="text-gray-400 cursor-help"
                              />
                            </Tooltip>
                          </label>
                          <input
                            type="text"
                            className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                            value={formatNumber(inputs.employmentInsurance)}
                            onChange={(e) =>
                              handleInputChange(
                                "employmentInsurance",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            <p>
                              국민연금: {formatNumber(inputs.nationalPension)}원
                            </p>
                            <p>
                              건강보험료: {formatNumber(inputs.healthInsurance)}
                              원
                            </p>
                            <p>
                              노인장기요양보험료:{" "}
                              {formatNumber(inputs.longTermCare)}원
                            </p>
                            <p>
                              고용보험료:{" "}
                              {formatNumber(inputs.employmentInsurance)}원
                            </p>
                          </div>
                        </div>

                        {/* 4대보험 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">
                            4대보험 소득공제 합계
                          </p>
                          <p className="text-2xl font-black">
                            {formatNumber(
                              inputs.nationalPension +
                                inputs.healthInsurance +
                                inputs.longTermCare +
                                inputs.employmentInsurance,
                            )}
                            원
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            전액 소득공제 적용
                          </p>
                        </div>
                      </>
                    )}

                    {/* 신용카드 등 사용액 */}
                    {cat.id === "card" && (
                      <>
                        {/* 기본 카드 사용액 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            💳 신용카드·직불카드·현금영수증
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                자녀 수 (한도 확대용)
                                <Tooltip content="2026년 기준: 자녀 1명당 50만원, 최대 100만원까지 한도 인상">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                min="0"
                                value={inputs.cardChildren}
                                onChange={(e) =>
                                  handleInputChange(
                                    "cardChildren",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                              {inputs.cardChildren > 0 && (
                                <p className="text-sm text-gray-600">
                                  💰 한도 확대:{" "}
                                  {formatNumber(
                                    Math.min(
                                      inputs.cardChildren * 500000,
                                      1000000,
                                    ),
                                  )}
                                  원 ({inputs.cardChildren}명 × 50만원, 최대
                                  100만원)
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                신용카드 사용액 (원)
                                <Tooltip content="공제율 15%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.creditCard)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "creditCard",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                직불카드 (원)
                                <Tooltip content="공제율 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.debitCard)}
                                onChange={(e) =>
                                  handleInputChange("debitCard", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                현금영수증 (원)
                                <Tooltip content="공제율 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.cash)}
                                onChange={(e) =>
                                  handleInputChange("cash", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 추가 공제 항목 */}
                        <div className="space-y-4 border-t-2 border-gray-200 pt-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            ➕ 추가 공제 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                전통시장 (원)
                                <Tooltip content="공제율 40%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.traditionalMarket)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "traditionalMarket",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                대중교통 사용액 (원)
                                <Tooltip content="공제율 40%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.publicTransport)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "publicTransport",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                문화체육 (도서·공연·체육시설 등) (원)
                                <Tooltip content="공제율 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.culture)}
                                onChange={(e) =>
                                  handleInputChange("culture", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {(() => {
                              const threshold = Math.round(
                                inputs.salary * 0.25,
                              );

                              // 순차적으로 25% 소진: 신용카드 → 직불카드 → 현금영수증 → 대중교통 → 전통시장 → 문화체육
                              let remaining = threshold;

                              // 1. 신용카드
                              const creditUsed = Math.min(
                                inputs.creditCard,
                                remaining,
                              );
                              const creditExcess =
                                inputs.creditCard - creditUsed;
                              remaining -= creditUsed;

                              // 2. 직불카드
                              const debitUsed = Math.min(
                                inputs.debitCard,
                                remaining,
                              );
                              const debitExcess = inputs.debitCard - debitUsed;
                              remaining -= debitUsed;

                              // 3. 현금영수증
                              const cashUsed = Math.min(inputs.cash, remaining);
                              const cashExcess = inputs.cash - cashUsed;
                              remaining -= cashUsed;

                              // 4. 대중교통
                              const transportUsed = Math.min(
                                inputs.publicTransport,
                                remaining,
                              );
                              const transportExcess =
                                inputs.publicTransport - transportUsed;
                              remaining -= transportUsed;

                              // 5. 전통시장
                              const marketUsed = Math.min(
                                inputs.traditionalMarket,
                                remaining,
                              );
                              const marketExcess =
                                inputs.traditionalMarket - marketUsed;
                              remaining -= marketUsed;

                              // 6. 문화체육
                              const cultureUsed = Math.min(
                                inputs.culture,
                                remaining,
                              );
                              const cultureExcess =
                                inputs.culture - cultureUsed;

                              // 공제 계산 (초과분에 대해서만)
                              const creditDeduction = Math.round(
                                creditExcess * 0.15,
                              );
                              const debitDeduction = Math.round(
                                debitExcess * 0.3,
                              );
                              const cashDeduction = Math.round(
                                cashExcess * 0.3,
                              );
                              const transportDeduction = Math.round(
                                transportExcess * 0.4,
                              );
                              const marketDeduction = Math.round(
                                marketExcess * 0.4,
                              );
                              const cultureDeduction = Math.round(
                                cultureExcess * 0.3,
                              );

                              // 기본 공제 합계 (신용카드, 직불카드, 현금영수증)
                              const basicDeduction =
                                creditDeduction +
                                debitDeduction +
                                cashDeduction;
                              const basicLimit =
                                (inputs.salary <= 70000000
                                  ? 3000000
                                  : inputs.salary <= 120000000
                                    ? 2500000
                                    : 2000000) +
                                Math.min(inputs.cardChildren * 500000, 1000000);
                              const finalBasic = Math.min(
                                basicDeduction,
                                basicLimit,
                              );

                              // 추가 공제 합계 (대중교통, 전통시장, 문화체육)
                              const additionalDeduction =
                                transportDeduction +
                                marketDeduction +
                                cultureDeduction;
                              const additionalLimit =
                                inputs.salary <= 70000000
                                  ? 3000000
                                  : inputs.salary <= 120000000
                                    ? 2500000
                                    : 2000000;
                              const finalAdditional = Math.min(
                                additionalDeduction,
                                additionalLimit,
                              );

                              return (
                                <>
                                  {/* 25% 기준 */}
                                  <p className="font-bold">
                                    ▸ 총급여의 25%: {formatNumber(threshold)}원
                                    (순차 소진)
                                  </p>

                                  {/* 순차 소진 상세 */}
                                  <p className="font-bold border-t border-black pt-1 mt-2">
                                    ▸ 25% 소진 순서 (초과분만 공제)
                                  </p>
                                  {inputs.creditCard > 0 && (
                                    <p>
                                      ① 신용카드:{" "}
                                      {formatNumber(inputs.creditCard)}원 중{" "}
                                      {formatNumber(creditUsed)}원 소진 →{" "}
                                      <span className="font-bold text-blue-600">
                                        초과 {formatNumber(creditExcess)}원 ×
                                        15% = {formatNumber(creditDeduction)}원
                                      </span>
                                    </p>
                                  )}
                                  {inputs.debitCard > 0 && (
                                    <p>
                                      ② 직불카드:{" "}
                                      {formatNumber(inputs.debitCard)}원 중{" "}
                                      {formatNumber(debitUsed)}원 소진 →{" "}
                                      <span className="font-bold text-blue-600">
                                        초과 {formatNumber(debitExcess)}원 × 30%
                                        = {formatNumber(debitDeduction)}원
                                      </span>
                                    </p>
                                  )}
                                  {inputs.cash > 0 && (
                                    <p>
                                      ③ 현금영수증: {formatNumber(inputs.cash)}
                                      원 중 {formatNumber(cashUsed)}원 소진 →{" "}
                                      <span className="font-bold text-blue-600">
                                        초과 {formatNumber(cashExcess)}원 × 30%
                                        = {formatNumber(cashDeduction)}원
                                      </span>
                                    </p>
                                  )}
                                  {inputs.publicTransport > 0 && (
                                    <p>
                                      ④ 대중교통:{" "}
                                      {formatNumber(inputs.publicTransport)}원
                                      중 {formatNumber(transportUsed)}원 소진 →{" "}
                                      <span className="font-bold text-green-600">
                                        초과 {formatNumber(transportExcess)}원 ×
                                        40% = {formatNumber(transportDeduction)}
                                        원
                                      </span>
                                    </p>
                                  )}
                                  {inputs.traditionalMarket > 0 && (
                                    <p>
                                      ⑤ 전통시장:{" "}
                                      {formatNumber(inputs.traditionalMarket)}원
                                      중 {formatNumber(marketUsed)}원 소진 →{" "}
                                      <span className="font-bold text-green-600">
                                        초과 {formatNumber(marketExcess)}원 ×
                                        40% = {formatNumber(marketDeduction)}원
                                      </span>
                                    </p>
                                  )}
                                  {inputs.culture > 0 && (
                                    <p>
                                      ⑥ 문화체육: {formatNumber(inputs.culture)}
                                      원 중 {formatNumber(cultureUsed)}원 소진 →{" "}
                                      <span className="font-bold text-green-600">
                                        초과 {formatNumber(cultureExcess)}원 ×
                                        30% = {formatNumber(cultureDeduction)}원
                                      </span>
                                    </p>
                                  )}

                                  {/* 기본 공제 한도 */}
                                  <p className="font-bold border-t border-black pt-1 mt-2">
                                    ▸ 기본 공제 (신용카드·직불카드·현금영수증)
                                  </p>
                                  <p className="text-gray-700">
                                    공제액: {formatNumber(basicDeduction)}원 /
                                    한도: {formatNumber(basicLimit)}원 →{" "}
                                    <span className="font-bold">
                                      {formatNumber(finalBasic)}원
                                    </span>
                                  </p>

                                  {/* 추가 공제 한도 */}
                                  {(inputs.publicTransport > 0 ||
                                    inputs.traditionalMarket > 0 ||
                                    inputs.culture > 0) && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 추가 공제 (대중교통·전통시장·문화체육)
                                      </p>
                                      <p className="text-gray-700">
                                        공제액:{" "}
                                        {formatNumber(additionalDeduction)}원 /
                                        한도: {formatNumber(additionalLimit)}원
                                        →{" "}
                                        <span className="font-bold">
                                          {formatNumber(finalAdditional)}원
                                        </span>
                                      </p>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 카드 소득공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">신용카드 등 소득공제</p>
                          <p className="text-2xl font-black">
                            {(() => {
                              const threshold = Math.round(
                                inputs.salary * 0.25,
                              );

                              // 순차적으로 25% 소진
                              let remaining = threshold;
                              const creditExcess = Math.max(
                                0,
                                inputs.creditCard - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.creditCard,
                              );
                              const debitExcess = Math.max(
                                0,
                                inputs.debitCard - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.debitCard,
                              );
                              const cashExcess = Math.max(
                                0,
                                inputs.cash - remaining,
                              );
                              remaining = Math.max(0, remaining - inputs.cash);
                              const transportExcess = Math.max(
                                0,
                                inputs.publicTransport - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.publicTransport,
                              );
                              const marketExcess = Math.max(
                                0,
                                inputs.traditionalMarket - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.traditionalMarket,
                              );
                              const cultureExcess = Math.max(
                                0,
                                inputs.culture - remaining,
                              );

                              // 기본 공제
                              const basicDeduction =
                                Math.round(creditExcess * 0.15) +
                                Math.round(debitExcess * 0.3) +
                                Math.round(cashExcess * 0.3);
                              const basicLimit =
                                (inputs.salary <= 70000000
                                  ? 3000000
                                  : inputs.salary <= 120000000
                                    ? 2500000
                                    : 2000000) +
                                Math.min(inputs.cardChildren * 500000, 1000000);
                              const finalBasic = Math.min(
                                basicDeduction,
                                basicLimit,
                              );

                              // 추가 공제
                              const additionalDeduction =
                                Math.round(transportExcess * 0.4) +
                                Math.round(marketExcess * 0.4) +
                                Math.round(cultureExcess * 0.3);
                              const additionalLimit =
                                inputs.salary <= 70000000
                                  ? 3000000
                                  : inputs.salary <= 120000000
                                    ? 2500000
                                    : 2000000;
                              const finalAdditional = Math.min(
                                additionalDeduction,
                                additionalLimit,
                              );

                              return formatNumber(finalBasic + finalAdditional);
                            })()}
                            원
                          </p>
                          <p className="text-sm text-gray-600 mt-2 border-t border-black pt-2">
                            {(() => {
                              const threshold = Math.round(
                                inputs.salary * 0.25,
                              );
                              let remaining = threshold;
                              const creditExcess = Math.max(
                                0,
                                inputs.creditCard - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.creditCard,
                              );
                              const debitExcess = Math.max(
                                0,
                                inputs.debitCard - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.debitCard,
                              );
                              const cashExcess = Math.max(
                                0,
                                inputs.cash - remaining,
                              );
                              // transport/market/culture excess는 기본 공제 계산에 포함되지 않음 (별도 추가 공제 영역에서 처리)

                              const basicDeduction =
                                Math.round(creditExcess * 0.15) +
                                Math.round(debitExcess * 0.3) +
                                Math.round(cashExcess * 0.3);
                              const basicLimit =
                                (inputs.salary <= 70000000
                                  ? 3000000
                                  : inputs.salary <= 120000000
                                    ? 2500000
                                    : 2000000) +
                                Math.min(inputs.cardChildren * 500000, 1000000);
                              const finalBasic = Math.min(
                                basicDeduction,
                                basicLimit,
                              );

                              return (
                                <>
                                  <span className="font-bold">기본 공제:</span>{" "}
                                  {formatNumber(finalBasic)}원 (한도{" "}
                                  {formatNumber(basicLimit)}원)
                                </>
                              );
                            })()}
                          </p>
                          {(inputs.publicTransport > 0 ||
                            inputs.traditionalMarket > 0 ||
                            inputs.culture > 0) && (
                            <p className="text-sm text-gray-600 mt-1">
                              {(() => {
                                const threshold = Math.round(
                                  inputs.salary * 0.25,
                                );
                                let remaining = threshold;
                                remaining = Math.max(
                                  0,
                                  remaining - inputs.creditCard,
                                );
                                remaining = Math.max(
                                  0,
                                  remaining - inputs.debitCard,
                                );
                                remaining = Math.max(
                                  0,
                                  remaining - inputs.cash,
                                );
                                const transportExcess = Math.max(
                                  0,
                                  inputs.publicTransport - remaining,
                                );
                                remaining = Math.max(
                                  0,
                                  remaining - inputs.publicTransport,
                                );
                                const marketExcess = Math.max(
                                  0,
                                  inputs.traditionalMarket - remaining,
                                );
                                remaining = Math.max(
                                  0,
                                  remaining - inputs.traditionalMarket,
                                );
                                const cultureExcess = Math.max(
                                  0,
                                  inputs.culture - remaining,
                                );

                                const additionalDeduction =
                                  Math.round(transportExcess * 0.4) +
                                  Math.round(marketExcess * 0.4) +
                                  Math.round(cultureExcess * 0.3);
                                const additionalLimit =
                                  inputs.salary <= 70000000
                                    ? 3000000
                                    : inputs.salary <= 120000000
                                      ? 2500000
                                      : 2000000;
                                const finalAdditional = Math.min(
                                  additionalDeduction,
                                  additionalLimit,
                                );

                                return (
                                  <>
                                    <span className="font-bold">
                                      추가 공제:
                                    </span>{" "}
                                    {formatNumber(finalAdditional)}원 (한도{" "}
                                    {formatNumber(additionalLimit)}원)
                                  </>
                                );
                              })()}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* 의료비 */}
                    {cat.id === "medical" && (
                      <>
                        {/* 의료비 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            🏥 의료비 세부 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                난임시술비 (원)
                                <Tooltip content="30% 공제, 한도 없음">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.infertility)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "infertility",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                미숙아·선천성이상아 의료비 (원)
                                <Tooltip content="20% 공제, 한도 없음">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.premature)}
                                onChange={(e) =>
                                  handleInputChange("premature", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                본인/장애인/만65세이상/6세이하 의료비 (원)
                                <Tooltip content="15% 공제, 한도 없음">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.selfDisabledSenior)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "selfDisabledSenior",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                그 밖의 부양가족 의료비 (원)
                                <Tooltip content="15% 공제, 700만원 한도">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.otherFamily)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "otherFamily",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                실손의료보험금 (원)
                                <Tooltip content="공제대상에서 차감">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(
                                  inputs.insuranceReimbursement,
                                )}
                                onChange={(e) =>
                                  handleInputChange(
                                    "insuranceReimbursement",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {(() => {
                              const totalMedical =
                                inputs.infertility +
                                inputs.premature +
                                inputs.selfDisabledSenior +
                                inputs.otherFamily;
                              const actualMedical =
                                totalMedical - inputs.insuranceReimbursement;
                              const threshold = Math.round(
                                inputs.salary * 0.03,
                              );
                              const excessAmount = Math.max(
                                0,
                                actualMedical - threshold,
                              );

                              // 순차적으로 3% 소진: 공제율 높은순 - 난임시술비(30%) → 미숙아(20%) → 본인/장애인/65세+/6세-(15%) → 그 밖의 부양가족(15%)
                              let remaining = threshold;

                              // 1. 난임시술비 (30%, 한도 없음)
                              const infertilityUsed = Math.min(
                                inputs.infertility,
                                remaining,
                              );
                              const infertilityExcess =
                                inputs.infertility - infertilityUsed;
                              remaining -= infertilityUsed;

                              // 2. 미숙아·선천성이상아 (20%, 한도 없음)
                              const prematureUsed = Math.min(
                                inputs.premature,
                                remaining,
                              );
                              const prematureExcess =
                                inputs.premature - prematureUsed;
                              remaining -= prematureUsed;

                              // 3. 본인/장애인/65세이상/6세이하 (15%, 한도 없음)
                              const selfUsed = Math.min(
                                inputs.selfDisabledSenior,
                                remaining,
                              );
                              const selfExcess =
                                inputs.selfDisabledSenior - selfUsed;
                              remaining -= selfUsed;

                              // 4. 그 밖의 부양가족 (15%, 700만원 한도)
                              const otherUsed = Math.min(
                                inputs.otherFamily,
                                remaining,
                              );
                              const otherExcess =
                                inputs.otherFamily - otherUsed;

                              // 공제 계산 (초과분에 대해서만)
                              const infertilityDeduction = Math.round(
                                infertilityExcess * 0.3,
                              ); // 30%, 한도 없음
                              const prematureDeduction = Math.round(
                                prematureExcess * 0.2,
                              ); // 20%, 한도 없음
                              const selfDeduction = Math.round(
                                selfExcess * 0.15,
                              ); // 15%, 한도 없음
                              const otherDeduction = Math.round(
                                Math.min(otherExcess, 7000000) * 0.15,
                              ); // 15%, 700만원 한도

                              return (
                                <>
                                  {/* 총 의료비 */}
                                  <p className="font-bold">
                                    ▸ 총 의료비 사용금액
                                  </p>
                                  <p>{formatNumber(totalMedical)}원</p>
                                  <p>
                                    　- 실손의료보험금 (차감): -
                                    {formatNumber(
                                      inputs.insuranceReimbursement,
                                    )}
                                    원
                                  </p>
                                  <p className="font-bold">
                                    = 실제 의료비: {formatNumber(actualMedical)}
                                    원
                                  </p>

                                  {/* 3% 기준 */}
                                  <p className="font-bold border-t border-black pt-1 mt-2">
                                    ▸ 총급여 3% 기준 (최저한도)
                                  </p>
                                  <p>{formatNumber(threshold)}원</p>
                                  <p className="font-bold">
                                    = 3% 초과분 (공제대상 금액):{" "}
                                    {formatNumber(excessAmount)}원
                                  </p>

                                  {/* 순차 소진 상세 */}
                                  {excessAmount > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 항목별 세액공제 (공제율 높은순 소진)
                                      </p>
                                      {inputs.infertility > 0 && (
                                        <p>
                                          ① 난임시술비 (
                                          {formatNumber(inputs.infertility)}원
                                          중 {formatNumber(infertilityUsed)}원
                                          소진) →{" "}
                                          <span className="font-bold text-green-600">
                                            초과{" "}
                                            {formatNumber(infertilityExcess)}원
                                            × 30% ={" "}
                                            {formatNumber(infertilityDeduction)}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {inputs.premature > 0 && (
                                        <p>
                                          ② 미숙아·선천성이상아 (
                                          {formatNumber(inputs.premature)}원 중{" "}
                                          {formatNumber(prematureUsed)}원 소진)
                                          →{" "}
                                          <span className="font-bold text-green-600">
                                            초과 {formatNumber(prematureExcess)}
                                            원 × 20% ={" "}
                                            {formatNumber(prematureDeduction)}원
                                          </span>
                                        </p>
                                      )}
                                      {inputs.selfDisabledSenior > 0 && (
                                        <p>
                                          ③ 본인/장애인/65세+/6세- (
                                          {formatNumber(
                                            inputs.selfDisabledSenior,
                                          )}
                                          원 중 {formatNumber(selfUsed)}원 소진)
                                          →{" "}
                                          <span className="font-bold text-blue-600">
                                            초과 {formatNumber(selfExcess)}원 ×
                                            15% = {formatNumber(selfDeduction)}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {inputs.otherFamily > 0 && (
                                        <p>
                                          ④ 그 밖의 부양가족 (
                                          {formatNumber(inputs.otherFamily)}원
                                          중 {formatNumber(otherUsed)}원 소진) →{" "}
                                          <span className="font-bold text-blue-600">
                                            초과 {formatNumber(otherExcess)}원 ×
                                            15% = {formatNumber(otherDeduction)}
                                            원
                                          </span>
                                          {otherExcess > 7000000 && (
                                            <span className="text-red-500">
                                              {" "}
                                              (700만원 한도 적용)
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 의료비 공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">🏥 의료비 세액공제</p>
                          <p className="text-2xl font-black">
                            {(() => {
                              const totalMedical =
                                inputs.infertility +
                                inputs.premature +
                                inputs.selfDisabledSenior +
                                inputs.otherFamily;
                              const actualMedical =
                                totalMedical - inputs.insuranceReimbursement;
                              const threshold = Math.round(
                                inputs.salary * 0.03,
                              );

                              // 실제 의료비가 3% 미만이면 공제 없음
                              if (actualMedical <= threshold) {
                                return "0";
                              }

                              // 순차적으로 3% 소진 (공제율 높은순)
                              let remaining = threshold;
                              const infertilityExcess = Math.max(
                                0,
                                inputs.infertility - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.infertility,
                              );
                              const prematureExcess = Math.max(
                                0,
                                inputs.premature - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.premature,
                              );
                              const selfExcess = Math.max(
                                0,
                                inputs.selfDisabledSenior - remaining,
                              );
                              remaining = Math.max(
                                0,
                                remaining - inputs.selfDisabledSenior,
                              );
                              const otherExcess = Math.max(
                                0,
                                inputs.otherFamily - remaining,
                              );

                              // 공제 계산
                              const infertilityDeduction = Math.round(
                                infertilityExcess * 0.3,
                              );
                              const prematureDeduction = Math.round(
                                prematureExcess * 0.2,
                              );
                              const selfDeduction = Math.round(
                                selfExcess * 0.15,
                              );
                              const otherDeduction = Math.round(
                                Math.min(otherExcess, 7000000) * 0.15,
                              );

                              return formatNumber(
                                selfDeduction +
                                  otherDeduction +
                                  infertilityDeduction +
                                  prematureDeduction,
                              );
                            })()}
                            원
                          </p>
                          <p className="text-sm text-gray-600 mt-2 border-t border-black pt-2">
                            {(() => {
                              const totalMedical =
                                inputs.infertility +
                                inputs.premature +
                                inputs.selfDisabledSenior +
                                inputs.otherFamily;
                              const actualMedical =
                                totalMedical - inputs.insuranceReimbursement;
                              const threshold = Math.round(
                                inputs.salary * 0.03,
                              );
                              return (
                                <>
                                  실제 의료비: {formatNumber(actualMedical)}원 |
                                  3% 기준: {formatNumber(threshold)}원 | 초과분:{" "}
                                  {formatNumber(
                                    Math.max(0, actualMedical - threshold),
                                  )}
                                  원
                                </>
                              );
                            })()}
                          </p>
                        </div>
                      </>
                    )}

                    {/* 교육비 */}
                    {cat.id === "edu" && (
                      <>
                        {/* 교육비 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            📚 교육비 세부 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                본인 교육비 (원)
                                <Tooltip content="한도 없음, 15% 공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.selfEducation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "selfEducation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                자녀 교육비 - 미취학 (원)
                                <Tooltip content="1인당 연 300만원 한도, 15% 공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.preschool)}
                                onChange={(e) =>
                                  handleInputChange("preschool", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                자녀 교육비 - 초중고 (원)
                                <Tooltip content="1인당 연 300만원 한도, 15% 공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.elementary)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "elementary",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                자녀 교육비 - 대학 (원)
                                <Tooltip content="1인당 연 900만원 한도, 15% 공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.university)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "university",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {inputs.selfEducation > 0 && (
                              <p>
                                본인 교육비:{" "}
                                {formatNumber(inputs.selfEducation)}원 × 15%
                              </p>
                            )}
                            {inputs.preschool > 0 && (
                              <p>
                                미취학:{" "}
                                {formatNumber(
                                  Math.min(inputs.preschool, 3000000),
                                )}
                                원 × 15% (한도 300만원)
                              </p>
                            )}
                            {inputs.elementary > 0 && (
                              <p>
                                초중고:{" "}
                                {formatNumber(
                                  Math.min(inputs.elementary, 3000000),
                                )}
                                원 × 15% (한도 300만원)
                              </p>
                            )}
                            {inputs.university > 0 && (
                              <p>
                                대학:{" "}
                                {formatNumber(
                                  Math.min(inputs.university, 9000000),
                                )}
                                원 × 15% (한도 900만원)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 교육비 공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">교육비 세액공제</p>
                          <p className="text-2xl font-black">
                            {formatNumber(
                              Math.round(
                                (inputs.selfEducation +
                                  Math.min(inputs.preschool, 3000000) +
                                  Math.min(inputs.elementary, 3000000) +
                                  Math.min(inputs.university, 9000000)) *
                                  0.15,
                              ),
                            )}
                            원
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            💡 교육비의 15% 세액공제
                          </p>
                        </div>
                      </>
                    )}

                    {/* 주택자금 */}
                    {cat.id === "house" && (
                      <>
                        {/* 주택자금 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            🏠 주택자금 세부 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                주택청약저축 납입액 (원)
                                <Tooltip content="연 납입액 최대 300만원 한도, 40% 소득공제 (총급여 7천만원 이하)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className={clsx(
                                  "w-full h-11 rounded-md border bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors",
                                  inputs.salary > 70000000
                                    ? "border-danger bg-danger/5"
                                    : "border-neutral-200 hover:border-neutral-300 focus-visible:border-primary",
                                )}
                                value={formatNumber(inputs.housingSubscription)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "housingSubscription",
                                    e.target.value,
                                  )
                                }
                              />
                              {inputs.salary > 70000000 &&
                                inputs.housingSubscription > 0 && (
                                  <p className="text-xs text-red-500 font-bold">
                                    ⚠️ 총급여 7천만원 초과로 공제 불가
                                  </p>
                                )}
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                주택임차차입금 원리금상환액 (원)
                                <Tooltip content="연간 상환액의 40% 소득 공제, 연간 최대 400만원까지 공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.rentLoanPayment)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "rentLoanPayment",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                장기주택저당차입금 이자상환액 (원)
                                <Tooltip content="상환기간·방식에 따라 300~1,800만원 한도, 전액 소득공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.mortgageInterest)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "mortgageInterest",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                월세 세액공제 (원)
                                <Tooltip content="연간 1,000만원 한도, 총급여 5,500만원 이하 17%, 초과 15%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.monthlyRent)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "monthlyRent",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {((inputs.housingSubscription > 0 &&
                              inputs.salary <= 70000000) ||
                              inputs.rentLoanPayment > 0 ||
                              inputs.mortgageInterest > 0) && (
                              <>
                                <p className="font-bold">▸ 소득공제</p>
                                {inputs.housingSubscription > 0 &&
                                  inputs.salary <= 70000000 && (
                                    <p>
                                      주택청약저축:{" "}
                                      {formatNumber(
                                        Math.min(
                                          inputs.housingSubscription,
                                          3000000,
                                        ),
                                      )}
                                      원 × 40% (연간 납입액 한도 300만원)
                                    </p>
                                  )}
                                {inputs.housingSubscription > 0 &&
                                  inputs.salary > 70000000 && (
                                    <p className="text-red-500">
                                      주택청약저축: 총급여 7천만원 초과로 공제
                                      제외
                                    </p>
                                  )}
                                {inputs.rentLoanPayment > 0 && (
                                  <p>
                                    주택임차차입금:{" "}
                                    {formatNumber(
                                      Math.min(inputs.rentLoanPayment, 4000000),
                                    )}
                                    원 × 40% (연간 공제 한도 400만원)
                                  </p>
                                )}
                                {inputs.mortgageInterest > 0 && (
                                  <p>
                                    장기주택저당차입금:{" "}
                                    {formatNumber(inputs.mortgageInterest)}원
                                    (전액 공제)
                                  </p>
                                )}
                              </>
                            )}
                            {inputs.monthlyRent > 0 && (
                              <>
                                <p className="font-bold border-t border-black pt-1 mt-2">
                                  ▸ 세액공제
                                </p>
                                <p>
                                  월세:{" "}
                                  {formatNumber(
                                    Math.min(inputs.monthlyRent, 10000000),
                                  )}
                                  원 ×{" "}
                                  {inputs.salary <= 55000000 ? "17%" : "15%"}{" "}
                                  (한도 1,000만원)
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 주택자금 공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">주택자금 공제</p>
                          <p className="text-2xl font-black">
                            {formatNumber(
                              (inputs.salary <= 70000000
                                ? Math.round(
                                    Math.min(
                                      inputs.housingSubscription,
                                      3000000,
                                    ) * 0.4,
                                  )
                                : 0) +
                                Math.round(
                                  Math.min(inputs.rentLoanPayment, 4000000) *
                                    0.4,
                                ) +
                                inputs.mortgageInterest +
                                Math.round(
                                  Math.min(inputs.monthlyRent, 10000000) *
                                    (inputs.salary <= 55000000 ? 0.17 : 0.15),
                                ),
                            )}
                            원
                          </p>
                          <div className="text-sm text-gray-600 mt-2 border-t border-black pt-2 space-y-1">
                            {((inputs.housingSubscription > 0 &&
                              inputs.salary <= 70000000) ||
                              inputs.rentLoanPayment > 0 ||
                              inputs.mortgageInterest > 0) && (
                              <p>
                                • <span className="font-bold">소득공제:</span>{" "}
                                {formatNumber(
                                  (inputs.salary <= 70000000
                                    ? Math.round(
                                        Math.min(
                                          inputs.housingSubscription,
                                          3000000,
                                        ) * 0.4,
                                      )
                                    : 0) +
                                    Math.round(
                                      Math.min(
                                        inputs.rentLoanPayment,
                                        4000000,
                                      ) * 0.4,
                                    ) +
                                    inputs.mortgageInterest,
                                )}
                                원
                              </p>
                            )}
                            {inputs.housingSubscription > 0 &&
                              inputs.salary <= 70000000 && (
                                <p className="pl-4 text-xs">
                                  - 주택청약저축:{" "}
                                  {formatNumber(
                                    Math.round(
                                      Math.min(
                                        inputs.housingSubscription,
                                        3000000,
                                      ) * 0.4,
                                    ),
                                  )}
                                  원
                                </p>
                              )}
                            {inputs.housingSubscription > 0 &&
                              inputs.salary > 70000000 && (
                                <p className="pl-4 text-xs text-red-500">
                                  - 주택청약저축: 총급여 7천만원 초과로 공제
                                  제외
                                </p>
                              )}
                            {inputs.rentLoanPayment > 0 && (
                              <p className="pl-4 text-xs">
                                - 주택임차차입금:{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(inputs.rentLoanPayment, 4000000) *
                                      0.4,
                                  ),
                                )}
                                원
                              </p>
                            )}
                            {inputs.mortgageInterest > 0 && (
                              <p className="pl-4 text-xs">
                                - 장기주택저당차입금:{" "}
                                {formatNumber(inputs.mortgageInterest)}원
                              </p>
                            )}
                            {inputs.monthlyRent > 0 && (
                              <p>
                                • <span className="font-bold">세액공제:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(inputs.monthlyRent, 10000000) *
                                      (inputs.salary <= 55000000 ? 0.17 : 0.15),
                                  ),
                                )}
                                원
                              </p>
                            )}
                            {inputs.monthlyRent > 0 && (
                              <p className="pl-4 text-xs">
                                - 월세:{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(inputs.monthlyRent, 10000000) *
                                      (inputs.salary <= 55000000 ? 0.17 : 0.15),
                                  ),
                                )}
                                원
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            💡 무주택 세대주 요건 충족 시 적용 (주택청약저축은
                            총급여 7천만원 이하)
                          </p>
                        </div>
                      </>
                    )}

                    {/* 연금계좌 */}
                    {cat.id === "pension" && (
                      <>
                        {/* 연금계좌 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            💰 연금계좌 세부 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                연금저축 납입액 (원)
                                <Tooltip content="연간 600만원 한도, 12% 세액공제 (지방세 제외)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.pensionSavings)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "pensionSavings",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                퇴직연금(IRP) 납입액 (원)
                                <Tooltip content="연금저축 포함 연간 900만원 한도, 12% 세액공제 (지방세 제외)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.irp)}
                                onChange={(e) =>
                                  handleInputChange("irp", e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                ISA 만기 전환금액 (원)
                                <Tooltip content="ISA 만기 후 연금계좌 전환 시 추가 300만원 한도 (10%), 12% 세액공제 (지방세 제외)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.isaTransfer)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "isaTransfer",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 보장성 보험료 세부 항목 */}
                        <div className="space-y-4 border-t-2 border-black pt-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            🛡️ 보장성 보험료
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                일반 보장성 보험료 (원)
                                <Tooltip content="연간 100만원 한도, 12% 세액공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.generalInsurance)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "generalInsurance",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                장애인 전용 보장성 보험료 (원)
                                <Tooltip content="연간 100만원 한도, 15% 세액공제">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.disabledInsurance)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "disabledInsurance",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {(inputs.pensionSavings > 0 ||
                              inputs.irp > 0 ||
                              inputs.isaTransfer > 0) && (
                              <>
                                <p className="font-bold">▸ 연금계좌</p>
                                {inputs.pensionSavings > 0 && (
                                  <p>
                                    연금저축:{" "}
                                    {formatNumber(
                                      Math.min(inputs.pensionSavings, 6000000),
                                    )}
                                    원 × 12% (한도 600만원)
                                  </p>
                                )}
                                {inputs.irp > 0 && (
                                  <p>
                                    퇴직연금(IRP):{" "}
                                    {formatNumber(
                                      Math.min(
                                        inputs.irp,
                                        9000000 -
                                          Math.min(
                                            inputs.pensionSavings,
                                            6000000,
                                          ),
                                      ),
                                    )}
                                    원 × 12% (총 900만원 한도)
                                  </p>
                                )}
                                {inputs.isaTransfer > 0 && (
                                  <p>
                                    ISA 전환:{" "}
                                    {formatNumber(
                                      Math.min(
                                        inputs.isaTransfer * 0.1,
                                        3000000,
                                      ),
                                    )}
                                    원 (10%, 한도 300만원)
                                  </p>
                                )}
                              </>
                            )}
                            {(inputs.generalInsurance > 0 ||
                              inputs.disabledInsurance > 0) && (
                              <>
                                <p className="font-bold border-t border-black pt-1 mt-2">
                                  ▸ 보장성 보험료
                                </p>
                                {inputs.generalInsurance > 0 && (
                                  <p>
                                    일반 보장성 보험:{" "}
                                    {formatNumber(
                                      Math.min(
                                        inputs.generalInsurance,
                                        1000000,
                                      ),
                                    )}
                                    원 × 12% (한도 100만원)
                                  </p>
                                )}
                                {inputs.disabledInsurance > 0 && (
                                  <p>
                                    장애인 전용 보험:{" "}
                                    {formatNumber(
                                      Math.min(
                                        inputs.disabledInsurance,
                                        1000000,
                                      ),
                                    )}
                                    원 × 15% (한도 100만원)
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* 연금계좌·보험료 공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">
                            연금계좌·보험료 세액공제
                          </p>
                          <p className="text-2xl font-black">
                            {formatNumber(
                              Math.round(
                                (Math.min(inputs.pensionSavings, 6000000) +
                                  Math.min(
                                    inputs.irp,
                                    9000000 -
                                      Math.min(inputs.pensionSavings, 6000000),
                                  ) +
                                  Math.min(inputs.isaTransfer * 0.1, 3000000)) *
                                  0.12,
                              ) +
                                Math.round(
                                  Math.min(inputs.generalInsurance, 1000000) *
                                    0.12,
                                ) +
                                Math.round(
                                  Math.min(inputs.disabledInsurance, 1000000) *
                                    0.15,
                                ),
                            )}
                            원
                          </p>
                          <div className="text-sm text-gray-600 mt-2 border-t border-black pt-2 space-y-1">
                            <p>
                              • <span className="font-bold">연금계좌:</span>{" "}
                              {formatNumber(
                                Math.round(
                                  (Math.min(inputs.pensionSavings, 6000000) +
                                    Math.min(
                                      inputs.irp,
                                      9000000 -
                                        Math.min(
                                          inputs.pensionSavings,
                                          6000000,
                                        ),
                                    ) +
                                    Math.min(
                                      inputs.isaTransfer * 0.1,
                                      3000000,
                                    )) *
                                    0.12,
                                ),
                              )}
                              원 세액공제
                            </p>
                            <p>
                              • <span className="font-bold">보장성보험료:</span>{" "}
                              {formatNumber(
                                Math.round(
                                  Math.min(inputs.generalInsurance, 1000000) *
                                    0.12,
                                ) +
                                  Math.round(
                                    Math.min(
                                      inputs.disabledInsurance,
                                      1000000,
                                    ) * 0.15,
                                  ),
                              )}
                              원 세액공제
                            </p>

                            {inputs.disabledInsurance > 0 && (
                              <p className="pl-4 text-xs">
                                - 장애인 전용:{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      inputs.disabledInsurance,
                                      1000000,
                                    ) * 0.15,
                                  ),
                                )}
                                원
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            💡 연금저축 + IRP 합계 최대 900만원, ISA 전환 추가
                            300만원
                          </p>
                        </div>
                      </>
                    )}

                    {/* 기부금 */}
                    {cat.id === "donation" && (
                      <>
                        {/* 기부금 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            ❤️ 기부금 세부 항목
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                정치자금 기부금 (원)
                                <Tooltip content="10만원 이하 100/110, 초과 15%, 3천만원 초과 25%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.politicalDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "politicalDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                고향사랑 기부금 (원)
                                <Tooltip content="10만원 이하 100/110, 초과 15% (일반+특별재난 합산 2,000만원 한도)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.hometownDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "hometownDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                고향사랑 특별재난지역 (원)
                                <Tooltip content="10만원 이하 100/110, 초과 30% (일반+특별재난 합산 2,000만원 한도)">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.hometownDisaster)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "hometownDisaster",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                특례기부금 (원)
                                <Tooltip content="소득 100% 한도, 1천만원 이하 15%, 초과 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.specialDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "specialDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                우리사주조합 기부금 (원)
                                <Tooltip content="소득 30% 한도, 1천만원 이하 15%, 초과 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.employeeDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "employeeDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                일반기부금 - 종교단체 외 (원)
                                <Tooltip content="소득 30% 한도, 1천만원 이하 15%, 초과 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.designatedDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "designatedDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                일반기부금 - 종교단체 (원)
                                <Tooltip content="소득 10% 한도, 1천만원 이하 15%, 초과 30%">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="text"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={formatNumber(inputs.religiousDonation)}
                                onChange={(e) =>
                                  handleInputChange(
                                    "religiousDonation",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {(() => {
                              // 정치자금: 10만원 이하 100/110, 초과 15%, 3천만원 초과 25%
                              const politicalBase =
                                Math.min(inputs.politicalDonation, 100000) *
                                (100 / 110);
                              const politicalExcess = Math.max(
                                0,
                                inputs.politicalDonation - 100000,
                              );
                              const politicalExcess15 = Math.min(
                                politicalExcess,
                                30000000,
                              );
                              const politicalExcess25 = Math.max(
                                0,
                                politicalExcess - 30000000,
                              );

                              // 고향사랑: 합산 2천만원 한도
                              const hometownLimited = Math.min(
                                inputs.hometownDonation,
                                20000000,
                              );
                              const hometownDisasterLimited = Math.min(
                                inputs.hometownDisaster,
                                Math.max(0, 20000000 - hometownLimited),
                              );

                              const hometownBase =
                                Math.min(hometownLimited, 100000) * (100 / 110);
                              const hometownExcess =
                                Math.max(0, hometownLimited - 100000) * 0.15;

                              const disasterBase =
                                Math.min(hometownDisasterLimited, 100000) *
                                (100 / 110);
                              const disasterExcess =
                                Math.max(0, hometownDisasterLimited - 100000) *
                                0.3;

                              // 특례기부금: 1천만원 이하 15%, 초과 30%
                              const special15 =
                                Math.min(inputs.specialDonation, 10000000) *
                                0.15;
                              const special30 =
                                Math.max(0, inputs.specialDonation - 10000000) *
                                0.3;

                              // 우리사주조합: 소득 30% 한도
                              const employeeLimit = inputs.salary * 0.3;
                              const employeeLimited = Math.min(
                                inputs.employeeDonation,
                                employeeLimit,
                              );
                              const employee15 =
                                Math.min(employeeLimited, 10000000) * 0.15;
                              const employee30 =
                                Math.max(0, employeeLimited - 10000000) * 0.3;

                              // 일반기부금 (종교단체 외): 소득 30% 한도
                              const designatedLimit = inputs.salary * 0.3;
                              const designatedLimited = Math.min(
                                inputs.designatedDonation,
                                designatedLimit,
                              );
                              const designated15 =
                                Math.min(designatedLimited, 10000000) * 0.15;
                              const designated30 =
                                Math.max(0, designatedLimited - 10000000) * 0.3;

                              // 종교단체: 소득 10% 한도
                              const religiousLimit = inputs.salary * 0.1;
                              const religiousLimited = Math.min(
                                inputs.religiousDonation,
                                religiousLimit,
                              );
                              const religious15 =
                                Math.min(religiousLimited, 10000000) * 0.15;
                              const religious30 =
                                Math.max(0, religiousLimited - 10000000) * 0.3;

                              return (
                                <>
                                  {inputs.politicalDonation > 0 && (
                                    <>
                                      <p className="font-bold">
                                        ▸ 정치자금 기부금
                                      </p>
                                      {Math.min(
                                        inputs.politicalDonation,
                                        100000,
                                      ) > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(
                                              inputs.politicalDonation,
                                              100000,
                                            ),
                                          )}
                                          원 × 100/110 ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(politicalBase),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {politicalExcess15 > 0 && (
                                        <p>
                                          　{formatNumber(politicalExcess15)}원
                                          × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(
                                                politicalExcess15 * 0.15,
                                              ),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {politicalExcess25 > 0 && (
                                        <p>
                                          　{formatNumber(politicalExcess25)}원
                                          × 25% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(
                                                politicalExcess25 * 0.25,
                                              ),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.hometownDonation > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 고향사랑 기부금
                                      </p>
                                      {Math.min(hometownLimited, 100000) >
                                        0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(hometownLimited, 100000),
                                          )}
                                          원 × 100/110 ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(hometownBase),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {Math.max(0, hometownLimited - 100000) >
                                        0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              hometownLimited - 100000,
                                            ),
                                          )}
                                          원 × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(hometownExcess),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.hometownDisaster > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 고향사랑 특별재난지역
                                      </p>
                                      {Math.min(
                                        hometownDisasterLimited,
                                        100000,
                                      ) > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(
                                              hometownDisasterLimited,
                                              100000,
                                            ),
                                          )}
                                          원 × 100/110 ={" "}
                                          <span className="font-bold text-green-600">
                                            {formatNumber(
                                              Math.round(disasterBase),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {Math.max(
                                        0,
                                        hometownDisasterLimited - 100000,
                                      ) > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              hometownDisasterLimited - 100000,
                                            ),
                                          )}
                                          원 × 30% ={" "}
                                          <span className="font-bold text-green-600">
                                            {formatNumber(
                                              Math.round(disasterExcess),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.specialDonation > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 특례기부금
                                      </p>
                                      {Math.min(
                                        inputs.specialDonation,
                                        10000000,
                                      ) > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(
                                              inputs.specialDonation,
                                              10000000,
                                            ),
                                          )}
                                          원 × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(special15),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {Math.max(
                                        0,
                                        inputs.specialDonation - 10000000,
                                      ) > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              inputs.specialDonation - 10000000,
                                            ),
                                          )}
                                          원 × 30% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(special30),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.employeeDonation > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 우리사주조합 기부금
                                      </p>
                                      <p>
                                        　한도: 소득의 30% ={" "}
                                        {formatNumber(
                                          Math.round(employeeLimit),
                                        )}
                                        원
                                      </p>
                                      {employee15 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(employeeLimited, 10000000),
                                          )}
                                          원 × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(employee15),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {employee30 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              employeeLimited - 10000000,
                                            ),
                                          )}
                                          원 × 30% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(employee30),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.designatedDonation > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 일반기부금 (종교단체 외)
                                      </p>
                                      <p>
                                        　한도: 소득의 30% ={" "}
                                        {formatNumber(
                                          Math.round(designatedLimit),
                                        )}
                                        원
                                      </p>
                                      {designated15 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(
                                              designatedLimited,
                                              10000000,
                                            ),
                                          )}
                                          원 × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(designated15),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {designated30 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              designatedLimited - 10000000,
                                            ),
                                          )}
                                          원 × 30% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(designated30),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {inputs.religiousDonation > 0 && (
                                    <>
                                      <p className="font-bold border-t border-black pt-1 mt-2">
                                        ▸ 일반기부금 (종교단체)
                                      </p>
                                      <p>
                                        　한도: 소득의 10% ={" "}
                                        {formatNumber(
                                          Math.round(religiousLimit),
                                        )}
                                        원
                                      </p>
                                      {religious15 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.min(
                                              religiousLimited,
                                              10000000,
                                            ),
                                          )}
                                          원 × 15% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(religious15),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                      {religious30 > 0 && (
                                        <p>
                                          　
                                          {formatNumber(
                                            Math.max(
                                              0,
                                              religiousLimited - 10000000,
                                            ),
                                          )}
                                          원 × 30% ={" "}
                                          <span className="font-bold text-blue-600">
                                            {formatNumber(
                                              Math.round(religious30),
                                            )}
                                            원
                                          </span>
                                        </p>
                                      )}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* 기부금 공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">💗 기부금 세액공제</p>
                          <p className="text-2xl font-black">
                            {(() => {
                              // 정치자금
                              const politicalBase =
                                Math.min(inputs.politicalDonation, 100000) *
                                (100 / 110);
                              const politicalExcess = Math.max(
                                0,
                                inputs.politicalDonation - 100000,
                              );
                              const politicalExcess15 = Math.min(
                                politicalExcess,
                                30000000,
                              );
                              const politicalExcess25 = Math.max(
                                0,
                                politicalExcess - 30000000,
                              );
                              const politicalDeduction =
                                politicalBase +
                                politicalExcess15 * 0.15 +
                                politicalExcess25 * 0.25;

                              // 고향사랑
                              const hometownLimited = Math.min(
                                inputs.hometownDonation,
                                20000000,
                              );
                              const hometownDisasterLimited = Math.min(
                                inputs.hometownDisaster,
                                Math.max(0, 20000000 - hometownLimited),
                              );
                              const hometownBase =
                                Math.min(hometownLimited, 100000) * (100 / 110);
                              const hometownExcess =
                                Math.max(0, hometownLimited - 100000) * 0.15;
                              const hometownDeduction =
                                hometownBase + hometownExcess;
                              const disasterBase =
                                Math.min(hometownDisasterLimited, 100000) *
                                (100 / 110);
                              const disasterExcess =
                                Math.max(0, hometownDisasterLimited - 100000) *
                                0.3;
                              const disasterDeduction =
                                disasterBase + disasterExcess;

                              // 특례, 우리사주, 일반, 종교
                              const special15 =
                                Math.min(inputs.specialDonation, 10000000) *
                                0.15;
                              const special30 =
                                Math.max(0, inputs.specialDonation - 10000000) *
                                0.3;
                              const employeeLimited = Math.min(
                                inputs.employeeDonation,
                                inputs.salary * 0.3,
                              );
                              const employee15 =
                                Math.min(employeeLimited, 10000000) * 0.15;
                              const employee30 =
                                Math.max(0, employeeLimited - 10000000) * 0.3;
                              const designatedLimited = Math.min(
                                inputs.designatedDonation,
                                inputs.salary * 0.3,
                              );
                              const designated15 =
                                Math.min(designatedLimited, 10000000) * 0.15;
                              const designated30 =
                                Math.max(0, designatedLimited - 10000000) * 0.3;
                              const religiousLimited = Math.min(
                                inputs.religiousDonation,
                                inputs.salary * 0.1,
                              );
                              const religious15 =
                                Math.min(religiousLimited, 10000000) * 0.15;
                              const religious30 =
                                Math.max(0, religiousLimited - 10000000) * 0.3;

                              const totalDeduction =
                                politicalDeduction +
                                hometownDeduction +
                                disasterDeduction +
                                special15 +
                                special30 +
                                employee15 +
                                employee30 +
                                designated15 +
                                designated30 +
                                religious15 +
                                religious30;

                              return formatNumber(Math.round(totalDeduction));
                            })()}
                            원
                          </p>
                          <div className="text-sm text-gray-600 mt-2 border-t border-black pt-2 space-y-1">
                            {inputs.politicalDonation > 0 && (
                              <p>
                                • <span className="font-bold">정치자금:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(inputs.politicalDonation, 100000) *
                                      (100 / 110) +
                                      Math.min(
                                        Math.max(
                                          0,
                                          inputs.politicalDonation - 100000,
                                        ),
                                        30000000,
                                      ) *
                                        0.15 +
                                      Math.max(
                                        0,
                                        inputs.politicalDonation -
                                          100000 -
                                          30000000,
                                      ) *
                                        0.25,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.hometownDonation > 0 && (
                              <p>
                                • <span className="font-bold">고향사랑:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      Math.min(
                                        inputs.hometownDonation,
                                        20000000,
                                      ),
                                      100000,
                                    ) *
                                      (100 / 110) +
                                      Math.max(
                                        0,
                                        Math.min(
                                          inputs.hometownDonation,
                                          20000000,
                                        ) - 100000,
                                      ) *
                                        0.15,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.hometownDisaster > 0 && (
                              <p>
                                •{" "}
                                <span className="font-bold">
                                  고향사랑 특별재난:
                                </span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      Math.min(
                                        inputs.hometownDisaster,
                                        Math.max(
                                          0,
                                          20000000 -
                                            Math.min(
                                              inputs.hometownDonation,
                                              20000000,
                                            ),
                                        ),
                                      ),
                                      100000,
                                    ) *
                                      (100 / 110) +
                                      Math.max(
                                        0,
                                        Math.min(
                                          inputs.hometownDisaster,
                                          Math.max(
                                            0,
                                            20000000 -
                                              Math.min(
                                                inputs.hometownDonation,
                                                20000000,
                                              ),
                                          ),
                                        ) - 100000,
                                      ) *
                                        0.3,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.specialDonation > 0 && (
                              <p>
                                • <span className="font-bold">특례기부금:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(inputs.specialDonation, 10000000) *
                                      0.15 +
                                      Math.max(
                                        0,
                                        inputs.specialDonation - 10000000,
                                      ) *
                                        0.3,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.employeeDonation > 0 && (
                              <p>
                                •{" "}
                                <span className="font-bold">우리사주조합:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      Math.min(
                                        inputs.employeeDonation,
                                        inputs.salary * 0.3,
                                      ),
                                      10000000,
                                    ) *
                                      0.15 +
                                      Math.max(
                                        0,
                                        Math.min(
                                          inputs.employeeDonation,
                                          inputs.salary * 0.3,
                                        ) - 10000000,
                                      ) *
                                        0.3,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.designatedDonation > 0 && (
                              <p>
                                •{" "}
                                <span className="font-bold">
                                  일반기부금(종교단체 외):
                                </span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      Math.min(
                                        inputs.designatedDonation,
                                        inputs.salary * 0.3,
                                      ),
                                      10000000,
                                    ) *
                                      0.15 +
                                      Math.max(
                                        0,
                                        Math.min(
                                          inputs.designatedDonation,
                                          inputs.salary * 0.3,
                                        ) - 10000000,
                                      ) *
                                        0.3,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                            {inputs.religiousDonation > 0 && (
                              <p>
                                • <span className="font-bold">종교단체:</span>{" "}
                                {formatNumber(
                                  Math.round(
                                    Math.min(
                                      Math.min(
                                        inputs.religiousDonation,
                                        inputs.salary * 0.1,
                                      ),
                                      10000000,
                                    ) *
                                      0.15 +
                                      Math.max(
                                        0,
                                        Math.min(
                                          inputs.religiousDonation,
                                          inputs.salary * 0.1,
                                        ) - 10000000,
                                      ) *
                                        0.3,
                                  ),
                                )}
                                원 세액공제
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            💡 총 기부액:{" "}
                            {formatNumber(
                              inputs.politicalDonation +
                                inputs.hometownDonation +
                                inputs.hometownDisaster +
                                inputs.specialDonation +
                                inputs.employeeDonation +
                                inputs.designatedDonation +
                                inputs.religiousDonation,
                            )}
                            원
                          </p>
                        </div>
                      </>
                    )}

                    {/* 자녀공제 */}
                    {cat.id === "childTaxCredit" && (
                      <>
                        {/* 자녀공제 세부 항목 */}
                        <div className="space-y-4">
                          <h4 className="font-black text-sm border-b-2 border-black pb-2">
                            👶 자녀 세액공제
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                만 8세 이상 자녀 수 (명)
                                <Tooltip content="1명 25만원, 2명 55만원, 3명 이상 55만원 + 2명 초과 1명당 40만원">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.childrenOver8}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    childrenOver8: Math.max(
                                      0,
                                      parseInt(e.target.value) || 0,
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="font-bold flex items-center gap-2">
                                출생·입양자
                                <Tooltip content="첫째 30만원, 둘째 50만원, 셋째 이상 70만원/명">
                                  <Info
                                    size={14}
                                    className="text-gray-400 cursor-help"
                                  />
                                </Tooltip>
                              </label>
                              <select
                                className="w-full h-11 rounded-md border border-neutral-200 bg-card px-3.5 text-body text-foreground font-mono tabular-nums text-right placeholder:text-neutral-300 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-600/25 transition-colors"
                                value={inputs.birthAdoption}
                                onChange={(e) =>
                                  setInputs((prev) => ({
                                    ...prev,
                                    birthAdoption: e.target
                                      .value as FormInputs["birthAdoption"],
                                  }))
                                }
                              >
                                <option value="none">선택 안함</option>
                                <option value="first">첫째 (30만원)</option>
                                <option value="second">둘째 (50만원)</option>
                                <option value="third1">
                                  셋째 이상 1명 (70만원)
                                </option>
                                <option value="third2">
                                  셋째 이상 2명 (140만원)
                                </option>
                                <option value="third3">
                                  셋째 이상 3명 (210만원)
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* 계산식 */}
                        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-md space-y-2">
                          <p className="font-bold text-sm">계산식</p>
                          <div className="text-sm space-y-1">
                            {inputs.childrenOver8 > 0 && (
                              <>
                                <p className="font-bold">▸ 만 8세 이상 자녀</p>
                                {inputs.childrenOver8 === 1 && (
                                  <p>
                                    　1명:{" "}
                                    <span className="font-bold text-blue-600">
                                      250,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.childrenOver8 === 2 && (
                                  <p>
                                    　2명:{" "}
                                    <span className="font-bold text-blue-600">
                                      550,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.childrenOver8 >= 3 && (
                                  <p>
                                    　{inputs.childrenOver8}명: 550,000원 + (
                                    {inputs.childrenOver8} - 2) × 400,000원 ={" "}
                                    <span className="font-bold text-blue-600">
                                      {formatNumber(
                                        550000 +
                                          (inputs.childrenOver8 - 2) * 400000,
                                      )}
                                      원
                                    </span>
                                  </p>
                                )}
                              </>
                            )}
                            {inputs.birthAdoption !== "none" && (
                              <>
                                <p className="font-bold border-t border-black pt-1 mt-2">
                                  ▸ 출생·입양
                                </p>
                                {inputs.birthAdoption === "first" && (
                                  <p>
                                    　첫째:{" "}
                                    <span className="font-bold text-green-600">
                                      300,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.birthAdoption === "second" && (
                                  <p>
                                    　둘째:{" "}
                                    <span className="font-bold text-green-600">
                                      500,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.birthAdoption === "third1" && (
                                  <p>
                                    　셋째 이상 1명: 700,000원 × 1명 ={" "}
                                    <span className="font-bold text-green-600">
                                      700,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.birthAdoption === "third2" && (
                                  <p>
                                    　셋째 이상 2명: 700,000원 × 2명 ={" "}
                                    <span className="font-bold text-green-600">
                                      1,400,000원
                                    </span>
                                  </p>
                                )}
                                {inputs.birthAdoption === "third3" && (
                                  <p>
                                    　셋째 이상 3명: 700,000원 × 3명 ={" "}
                                    <span className="font-bold text-green-600">
                                      2,100,000원
                                    </span>
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* 자녀공제 합계 */}
                        <div className="bg-warning/10 p-4 border border-warning/30 rounded-md">
                          <p className="font-bold mb-1">👶 자녀 세액공제</p>
                          <p className="text-2xl font-black">
                            {formatNumber(
                              (() => {
                                let total = 0;
                                // 기본공제 대상 자녀
                                if (inputs.childrenOver8 === 1) total += 250000;
                                else if (inputs.childrenOver8 === 2)
                                  total += 550000;
                                else if (inputs.childrenOver8 >= 3)
                                  total +=
                                    550000 +
                                    (inputs.childrenOver8 - 2) * 400000;
                                // 출생·입양 공제
                                if (inputs.birthAdoption === "first")
                                  total += 300000;
                                else if (inputs.birthAdoption === "second")
                                  total += 500000;
                                else if (inputs.birthAdoption === "third1")
                                  total += 700000;
                                else if (inputs.birthAdoption === "third2")
                                  total += 1400000;
                                else if (inputs.birthAdoption === "third3")
                                  total += 2100000;
                                return total;
                              })(),
                            )}
                            원
                          </p>
                          <div className="text-sm text-gray-600 mt-2 border-t border-black pt-2 space-y-1">
                            {inputs.childrenOver8 > 0 && (
                              <p>
                                •{" "}
                                <span className="font-bold">
                                  자녀 기본공제:
                                </span>{" "}
                                {formatNumber(
                                  inputs.childrenOver8 === 1
                                    ? 250000
                                    : inputs.childrenOver8 === 2
                                      ? 550000
                                      : inputs.childrenOver8 >= 3
                                        ? 550000 +
                                          (inputs.childrenOver8 - 2) * 400000
                                        : 0,
                                )}
                                원
                              </p>
                            )}
                            {inputs.birthAdoption !== "none" && (
                              <p>
                                • <span className="font-bold">출생·입양:</span>{" "}
                                {formatNumber(
                                  inputs.birthAdoption === "first"
                                    ? 300000
                                    : inputs.birthAdoption === "second"
                                      ? 500000
                                      : inputs.birthAdoption === "third1"
                                        ? 700000
                                        : inputs.birthAdoption === "third2"
                                          ? 1400000
                                          : inputs.birthAdoption === "third3"
                                            ? 2100000
                                            : 0,
                                )}
                                원
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            💡 기본공제 대상 자녀 중 출생·입양자가 있으면 추가
                            공제
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* 계산하기 버튼 */}
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={clsx(
            "inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50",
            isCalculating
              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
              : "bg-foreground text-card hover:bg-primary-700",
          )}
        >
          {isCalculating ? (
            <>
              <RefreshCw size={24} className="animate-spin" />
              계산 중...
            </>
          ) : (
            <>
              <Calculator size={24} />
              예상 환급액 계산하기
            </>
          )}
        </button>
      </div>

      {/* Floating Result Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          {/* 예상 환급액 - 9번 결과 */}
          <div className="rounded-lg bg-foreground text-card p-6 mb-4 shadow-md">
            <h3 className="text-caption font-semibold text-neutral-300 uppercase tracking-[0.06em] mb-2">
              ⑨ 예상 환급액
            </h3>
            {(() => {
              if (!result) return null;
              // 소득세 환급: 결정세액 - 기납부세액(소득세)
              const incomeTaxRefund = result.finalTax - result.withheldTax;
              // 지방소득세 결정세액: 결정세액의 10%
              const localTaxDue = Math.round(result.finalTax * 0.1);
              // 지방소득세 환급: 지방소득세 결정세액 - 기납부세액(지방소득세)
              const localTaxRefund = localTaxDue - inputs.localIncomeTax;
              // 총 환급액
              const totalRefund = incomeTaxRefund + localTaxRefund;

              return (
                <>
                  <div
                    className={clsx(
                      "text-mono-display font-bold tabular-nums mb-2",
                      totalRefund <= 0 ? "text-mint" : "text-danger",
                    )}
                  >
                    {formatNumber(totalRefund)}원
                  </div>
                  <div className="text-xs text-neutral-400 space-y-1">
                    <p className="font-semibold text-neutral-300">▸ 소득세</p>
                    <p className="pl-2">
                      결정세액: {formatNumber(result.finalTax)}원
                    </p>
                    <p className="pl-2">
                      기납부세액: -{formatNumber(result.withheldTax)}원
                    </p>
                    <p className="pl-2 text-mint">
                      → 소득세 환급: {formatNumber(incomeTaxRefund)}원
                    </p>

                    <p className="font-semibold text-neutral-300 pt-1">
                      ▸ 지방소득세
                    </p>
                    <p className="pl-2">
                      결정세액 (10%): {formatNumber(localTaxDue)}원
                    </p>
                    <p className="pl-2">
                      기납부세액: -{formatNumber(inputs.localIncomeTax)}원
                    </p>
                    <p className="pl-2 text-mint">
                      → 지방소득세 환급: {formatNumber(localTaxRefund)}원
                    </p>

                    <p className="border-t border-gray-600 pt-1 mt-1 font-bold">
                      총 환급액: {formatNumber(incomeTaxRefund)} +{" "}
                      {formatNumber(localTaxRefund)} ={" "}
                      {formatNumber(totalRefund)}원
                    </p>
                  </div>
                </>
              );
            })()}
            {!result && (
              <div className="text-4xl font-black mb-2 text-gray-500">
                계산을 시작하세요
              </div>
            )}
          </div>

          {/* 계산 플로우 1~8 */}
          {result && (
            <div className="rounded-lg border border-neutral-200 bg-card p-6 mb-4 text-sm">
              <h4 className="font-bold mb-3 border-b-2 border-black pb-2">
                📋 계산 플로우
              </h4>
              <div className="space-y-3">
                {/* 1. 총급여액 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">① 총급여액</span>
                  <span className="font-bold">
                    {formatNumber(result.salary)}원
                  </span>
                </div>

                {/* 2. 근로소득공제 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">② 근로소득공제</span>
                  <span className="font-bold text-blue-600">
                    -{formatNumber(result.incomeDeduction)}원
                  </span>
                </div>

                {/* 3. 근로소득금액 */}
                <div className="flex justify-between items-center bg-primary/5 p-2 -mx-2 border-y border-neutral-200">
                  <span className="font-bold">③ 근로소득금액</span>
                  <span className="font-bold">
                    {formatNumber(result.earnedIncome)}원
                  </span>
                </div>

                {/* 4. 소득공제 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">④ 소득공제 합계</span>
                  <span className="font-bold text-blue-600">
                    -{formatNumber(result.totalIncomeDeduction)}원
                  </span>
                </div>

                {/* 5. 과세표준 */}
                <div className="flex justify-between items-center bg-primary/5 p-2 -mx-2 border-y border-neutral-200">
                  <span className="font-bold">⑤ 과세표준</span>
                  <span className="font-bold">
                    {formatNumber(result.taxableIncome)}원
                  </span>
                </div>

                {/* 6. 산출세액 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">⑥ 산출세액</span>
                  <span className="font-bold">
                    {formatNumber(result.calculatedTax)}원
                  </span>
                </div>

                {/* 7. 세액공제 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">⑦ 세액공제 합계</span>
                  <span className="font-bold text-blue-600">
                    -{formatNumber(result.totalTaxCredit)}원
                  </span>
                </div>

                {/* 8. 결정세액 */}
                <div className="flex justify-between items-center bg-primary/5 p-2 -mx-2 border-y border-neutral-200">
                  <span className="font-bold">⑧ 결정세액</span>
                  <span className="font-bold">
                    {formatNumber(result.finalTax)}원
                  </span>
                </div>

                {/* 기납부세액 */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">기납부세액 (소득세)</span>
                  <span className="font-bold text-blue-600">
                    -{formatNumber(result.withheldTax)}원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">기납부세액 (지방소득세)</span>
                  <span className="font-bold text-blue-600">
                    -{formatNumber(inputs.localIncomeTax)}원
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 공제 내역 상세 */}
          {result && (
            <div className="rounded-lg border border-neutral-200 bg-card p-6 mb-4 text-sm">
              <h4 className="font-bold mb-3 border-b-2 border-black pb-2">
                📊 공제 내역 상세
              </h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between font-bold text-sm text-black border-b border-black pb-1">
                  <span>소득공제 (④)</span>
                  <span className="text-blue-600">
                    {formatNumber(result.totalIncomeDeduction)}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>인적공제</span>
                  <span>{formatNumber(result.personalDeduction)}원</span>
                </div>
                {result.socialInsuranceDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>4대보험</span>
                    <span>
                      {formatNumber(result.socialInsuranceDeduction)}원
                    </span>
                  </div>
                )}
                {result.cardDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>신용카드 등</span>
                    <span>{formatNumber(result.cardDeduction)}원</span>
                  </div>
                )}
                {result.housingDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>주택자금</span>
                    <span>{formatNumber(result.housingDeduction)}원</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-black border-b border-black pb-1 pt-2">
                  <span>세액공제 (⑦)</span>
                  <span className="text-blue-600">
                    {formatNumber(result.totalTaxCredit)}원
                  </span>
                </div>
                {result.earnedIncomeTaxCredit > 0 && (
                  <div className="flex justify-between">
                    <span>근로소득세액공제</span>
                    <span>{formatNumber(result.earnedIncomeTaxCredit)}원</span>
                  </div>
                )}
                {result.childTaxCredit > 0 && (
                  <div className="flex justify-between">
                    <span>자녀세액공제</span>
                    <span>{formatNumber(result.childTaxCredit)}원</span>
                  </div>
                )}
                {result.medicalDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>의료비</span>
                    <span>{formatNumber(result.medicalDeduction)}원</span>
                  </div>
                )}
                {result.educationDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>교육비</span>
                    <span>{formatNumber(result.educationDeduction)}원</span>
                  </div>
                )}
                {result.pensionDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>연금·보험료</span>
                    <span>{formatNumber(result.pensionDeduction)}원</span>
                  </div>
                )}
                {result.donationDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>기부금</span>
                    <span>{formatNumber(result.donationDeduction)}원</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <button className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg text-base font-semibold border border-primary text-primary bg-card hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50">
            <Sparkles size={24} />
            AI 최적화 제안 받기
          </button>

          <div className="mt-4 bg-white border-2 border-black p-4 text-sm">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              주의사항
            </h4>
            <p className="text-gray-600">
              이 결과는 시뮬레이션 값이며, 실제 국세청 확정 자료와 다를 수
              있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
