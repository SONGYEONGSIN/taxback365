"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DollarSign,
  CreditCard,
  FileText,
  RefreshCw,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Upload,
  Eye,
} from "lucide-react";
import clsx from "clsx";
import { parseSheetToRows } from "@/lib/excel-import";
import { saveAdminData, loadAdminData, AdminData } from "@/lib/tax-store";

// 월별 급여 데이터
interface MonthlySalaryData {
  totalSalary: string;
  mealAllowance: string; // 비과세 식대
  nationalPension: string; // 국민연금
  healthInsurance: string; // 건강보험
  longTermCare: string; // 노인장기요양보험
  employmentInsurance: string; // 고용보험
  bonus: string; // 상여금
  childTuition: string; // 자녀학자금
  prepaidTax: string; // 기납부세액 (소득세)
  localIncomeTax: string; // 기납부세액 (지방소득세)
}

interface Notification {
  type: "success" | "error";
  message: string;
}

interface TransactionDetail {
  date: string;
  merchant: string;
  amount: number;
}

interface SpendingItem {
  id: string;
  name: string;
  amount: string;
  month: number; // 1~12월
  details?: TransactionDetail[]; // 엑셀에서 파싱된 세부 거래 내역
}

export default function AdminPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [monthlySalary, setMonthlySalary] = useState<{
    [month: number]: MonthlySalaryData;
  }>(() => {
    const defaultData: MonthlySalaryData = {
      totalSalary: "0",
      mealAllowance: "0",
      nationalPension: "0",
      healthInsurance: "0",
      longTermCare: "0",
      employmentInsurance: "0",
      bonus: "0",
      childTuition: "0",
      prepaidTax: "0",
      localIncomeTax: "0",
    };
    const initial: { [month: number]: MonthlySalaryData } = {};
    for (let m = 1; m <= 12; m++) {
      initial[m] = { ...defaultData };
    }
    return initial;
  });
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isExcelDragging, setIsExcelDragging] = useState(false);
  const [excelModalMonth, setExcelModalMonth] = useState(1);
  const [, setOcrModalMonth] = useState(1);

  // OCR 상태
  const [ocrPreviewItems, setOcrPreviewItems] = useState<
    { category: string; merchant: string; amount: number }[]
  >([]);
  const [ocrCardType, setOcrCardType] = useState<"credit" | "debit" | "cash">(
    "credit",
  );
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrDuplicateItems, setOcrDuplicateItems] = useState<
    { merchant: string; amount: number }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrImageInputRef = useRef<HTMLInputElement>(null);
  const cardExcelInputRef = useRef<HTMLInputElement>(null);

  // 카드사 엑셀 업로드 상태
  const [showCardExcelModal, setShowCardExcelModal] = useState(false);
  const [cardExcelFile, setCardExcelFile] = useState<File | null>(null);
  const [isCardExcelDragging, setIsCardExcelDragging] = useState(false);
  const [cardType, setCardType] = useState<"credit" | "debit" | "cash">(
    "credit",
  );
  const [cardExcelPreview, setCardExcelPreview] = useState<
    {
      date: string;
      merchant: string;
      amount: number;
      excluded: boolean;
      category:
        | "card"
        | "transport"
        | "insurance"
        | "medical"
        | "market"
        | "culture"
        | "excluded";
      bizNo?: string;
    }[]
  >([]);
  const [excludedCount, setExcludedCount] = useState(0);

  // 전통시장 불확실 매칭 확인 상태
  const [uncertainMarketItems, setUncertainMarketItems] = useState<
    {
      merchantName: string;
      matchedMarketName: string;
      belongsTo: string;
      address: string;
      matchRatio: number;
      candidates?: Array<{
        marketName: string;
        belongsTo: string;
        address: string;
      }>;
    }[]
  >([]);
  const [showMarketConfirmModal, setShowMarketConfirmModal] = useState(false);

  // 지출 항목 상태
  const [selectedSpendingMonth, setSelectedSpendingMonth] = useState(1); // 지출 데이터 월 선택
  const [spendingItems, setSpendingItems] = useState<SpendingItem[]>([
    { id: "1", name: "신용카드", amount: "1,234,567", month: 1 },
    { id: "2", name: "직불카드", amount: "456,789", month: 1 },
    { id: "3", name: "현금영수증", amount: "50,000", month: 1 },
    { id: "4", name: "대중교통", amount: "80,000", month: 1 },
  ]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemMonth, setNewItemMonth] = useState(1); // 신규 항목 월 선택

  // 세부 내역 모달 상태
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] =
    useState<SpendingItem | null>(null);

  // 가족정보 상태 (기본공제 - 본인 제외)
  const [familyData, setFamilyData] = useState({
    spouse: false,
    children: 0,
    childrenUnder6: 0, // 6세 이하 자녀 수 (보육수당)
    childrenOver8: 0, // 8세 이상 자녀 수 (자녀세액공제)
    birthAdoption: "none" as
      | "none"
      | "first"
      | "second"
      | "third1"
      | "third2"
      | "third3", // 출생·입양자
    parents: 0,
    siblings: 0,
    foster: 0, // 위탁아동
    recipient: 0, // 기초생활수급자
    disabled: 0,
    seniorOver70: 0,
    singleParent: false,
  });

  const handleButtonClick = (btnName: string, callback?: () => void) => {
    setClickedBtn(btnName);
    callback?.();
    setTimeout(() => setClickedBtn(null), 300);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 저장된 데이터 불러오기 (연도별)
  const loadYearData = async (year: number) => {
    const savedData = await loadAdminData(year);
    if (savedData) {
      // 월별 급여 데이터 복원
      if (savedData.salary.monthly) {
        setMonthlySalary(savedData.salary.monthly);
      } else {
        // 구버전 호환: 단일 데이터를 12개월에 복사
        const legacyData: MonthlySalaryData = {
          totalSalary:
            savedData.salary.totalSalary?.toLocaleString("ko-KR") || "0",
          mealAllowance:
            savedData.salary.mealAllowance?.toLocaleString("ko-KR") || "0",
          nationalPension:
            savedData.salary.nationalPension?.toLocaleString("ko-KR") || "0",
          healthInsurance:
            savedData.salary.healthInsurance?.toLocaleString("ko-KR") || "0",
          longTermCare:
            savedData.salary.longTermCare?.toLocaleString("ko-KR") || "0",
          employmentInsurance:
            savedData.salary.employmentInsurance?.toLocaleString("ko-KR") ||
            "0",
          bonus: savedData.salary.bonus?.toLocaleString("ko-KR") || "0",
          childTuition:
            savedData.salary.childTuition?.toLocaleString("ko-KR") || "0",
          prepaidTax:
            savedData.salary.prepaidTax?.toLocaleString("ko-KR") || "0",
          localIncomeTax:
            savedData.salary.localIncomeTax?.toLocaleString("ko-KR") || "0",
        };
        const monthlyInit: { [month: number]: MonthlySalaryData } = {};
        for (let m = 1; m <= 12; m++) {
          monthlyInit[m] = { ...legacyData };
        }
        setMonthlySalary(monthlyInit);
      }
      // 6세 이하 자녀 수는 가족 정보로 복원
      if (savedData.salary.childrenUnder6 !== undefined) {
        setFamilyData((prev) => ({
          ...prev,
          childrenUnder6: savedData.salary.childrenUnder6,
        }));
      }
      // 지출 항목 복원 - spendingItems 배열 우선 사용 (없으면 구버전 호환)
      if (savedData.spendingItems && savedData.spendingItems.length > 0) {
        // 새 형식: spendingItems 배열 직접 복원
        setSpendingItems(savedData.spendingItems);
      } else {
        // 구버전 호환: 카테고리별 복원
        const restoredSpending: SpendingItem[] = [];
        if (savedData.spending.creditCard > 0) {
          restoredSpending.push({
            id: "1",
            name: "신용카드",
            amount: savedData.spending.creditCard.toLocaleString("ko-KR"),
            month: 1,
          });
        }
        if (savedData.spending.debitCard > 0) {
          restoredSpending.push({
            id: "2",
            name: "체크카드",
            amount: savedData.spending.debitCard.toLocaleString("ko-KR"),
            month: 1,
          });
        }
        if (savedData.spending.cash > 0) {
          restoredSpending.push({
            id: "3",
            name: "현금영수증",
            amount: savedData.spending.cash.toLocaleString("ko-KR"),
            month: 1,
          });
        }
        if (savedData.spending.publicTransport > 0) {
          restoredSpending.push({
            id: "4",
            name: "대중교통",
            amount: savedData.spending.publicTransport.toLocaleString("ko-KR"),
            month: 1,
          });
        }
        setSpendingItems(restoredSpending.length > 0 ? restoredSpending : []);
      }
      // 가족정보 복원 (이전 데이터 호환)
      if (savedData.family) {
        setFamilyData({
          spouse: savedData.family.spouse || false,
          children: savedData.family.children || 0,
          childrenUnder6:
            savedData.family.childrenUnder6 ||
            savedData.salary.childrenUnder6 ||
            0,
          childrenOver8: savedData.family.childrenOver8 || 0,
          birthAdoption: savedData.family.birthAdoption || "none",
          parents: savedData.family.parents || 0,
          siblings: savedData.family.siblings || 0,
          foster: savedData.family.foster || 0,
          recipient: savedData.family.recipient || 0,
          disabled: savedData.family.disabled || 0,
          seniorOver70: savedData.family.seniorOver70 || 0,
          singleParent: savedData.family.singleParent || false,
        });
      }
    } else {
      // 데이터 없을 시 초기화
      const defaultData: MonthlySalaryData = {
        totalSalary: "0",
        mealAllowance: "0",
        nationalPension: "0",
        healthInsurance: "0",
        longTermCare: "0",
        employmentInsurance: "0",
        bonus: "0",
        childTuition: "0",
        prepaidTax: "0",
        localIncomeTax: "0",
      };
      const initial: { [month: number]: MonthlySalaryData } = {};
      for (let m = 1; m <= 12; m++) {
        initial[m] = { ...defaultData };
      }
      setMonthlySalary(initial);
      setSpendingItems([]);
      setFamilyData({
        spouse: false,
        children: 0,
        childrenUnder6: 0,
        childrenOver8: 0,
        birthAdoption: "none",
        parents: 0,
        siblings: 0,
        foster: 0,
        recipient: 0,
        disabled: 0,
        seniorOver70: 0,
        singleParent: false,
      });
    }
  };

  // 초기 로드 - localStorage에서 마지막 선택 연도 복원
  useEffect(() => {
    const savedYear = localStorage.getItem("taxai_selected_year");
    const initialYear = savedYear ? parseInt(savedYear) : 2026; // 기본값 2026년
    setSelectedYear(initialYear);
    loadYearData(initialYear);
  }, []);

  // 연도 변경 시 데이터 리로드 + 선택 연도 저장
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    localStorage.setItem("taxai_selected_year", year.toString());
    loadYearData(year);
  };

  // 데이터 저장 함수
  const handleSave = async () => {
    const parseAmount = (str: string | undefined | null): number => {
      if (!str) return 0;
      return parseInt(str.replace(/[^0-9]/g, "")) || 0;
    };

    // 지출 항목에서 각 카테고리 금액 추출 (모든 월 합산)
    const getSpendingAmount = (name: string): number => {
      return spendingItems
        .filter((i) => i.name.includes(name))
        .reduce((sum, item) => sum + parseAmount(item.amount), 0);
    };

    const adminData: AdminData = {
      year: selectedYear,
      salary: {
        monthly: monthlySalary,
        childrenUnder6: familyData.childrenUnder6 || 0,
        // 연간 합계 (계산기로 전달용)
        totalSalary: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.totalSalary),
          0,
        ),
        bonus: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.bonus),
          0,
        ),
        childTuition: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.childTuition),
          0,
        ),
        mealAllowance: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.mealAllowance),
          0,
        ),
        nationalPension: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.nationalPension),
          0,
        ),
        healthInsurance: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.healthInsurance),
          0,
        ),
        longTermCare: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.longTermCare),
          0,
        ),
        employmentInsurance: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.employmentInsurance),
          0,
        ),
        prepaidTax: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.prepaidTax),
          0,
        ),
        localIncomeTax: Object.values(monthlySalary).reduce(
          (sum, m) => sum + parseAmount(m.localIncomeTax),
          0,
        ),
      },
      spending: {
        creditCard: getSpendingAmount("신용카드"),
        debitCard: getSpendingAmount("체크카드"),
        cash: getSpendingAmount("현금영수증"),
        publicTransport: getSpendingAmount("대중교통"),
        traditionalMarket: getSpendingAmount("전통시장"),
        culture: getSpendingAmount("문화"),
      },
      family: {
        spouse: familyData.spouse,
        children: familyData.children,
        childrenUnder6: familyData.childrenUnder6,
        childrenOver8: familyData.childrenOver8,
        birthAdoption: familyData.birthAdoption,
        parents: familyData.parents,
        siblings: familyData.siblings,
        foster: familyData.foster,
        recipient: familyData.recipient,
        disabled: familyData.disabled,
        seniorOver70: familyData.seniorOver70,
        singleParent: familyData.singleParent,
      },
      deductions: {
        medical: getSpendingAmount("의료비"), // 레거시 호환
        medicalInfertility: getSpendingAmount("의료비(난임시술비)"),
        medicalPremature: getSpendingAmount("의료비(미숙아,선천성)"),
        medicalSelf: getSpendingAmount("의료비(본인,장애,65세,6세)"),
        medicalFamily: getSpendingAmount("의료비(그밖부양가족)"),
        education: getSpendingAmount("교육비"), // 레거시 호환 (총합)
        educationSelf: getSpendingAmount("교육비(본인)"),
        educationChild: 0, // 레거시 호환
        educationPreschool1: getSpendingAmount("교육비(미취학)-자녀1"),
        educationPreschool2: getSpendingAmount("교육비(미취학)-자녀2"),
        educationPreschool3: getSpendingAmount("교육비(미취학)-자녀3"),
        educationK12_1: getSpendingAmount("교육비(초중고)-자녀1"),
        educationK12_2: getSpendingAmount("교육비(초중고)-자녀2"),
        educationK12_3: getSpendingAmount("교육비(초중고)-자녀3"),
        educationUniv: 0, // 레거시 호환
        educationUniv1: getSpendingAmount("교육비(대학)-자녀1"),
        educationUniv2: getSpendingAmount("교육비(대학)-자녀2"),
        educationUniv3: getSpendingAmount("교육비(대학)-자녀3"),
        housing:
          getSpendingAmount("주택자금(청약저축)") +
          getSpendingAmount("주택자금(청약저축) - 세대주") +
          getSpendingAmount("주택자금(청약저축) - 배우자"), // 레거시 호환
        housingSubscription:
          getSpendingAmount("주택자금(청약저축)") +
          getSpendingAmount("주택자금(청약저축) - 세대주") +
          getSpendingAmount("주택자금(청약저축) - 배우자"),
        housingSubscriptionHead:
          getSpendingAmount("주택자금(청약저축) - 세대주"),
        housingSubscriptionSpouse:
          getSpendingAmount("주택자금(청약저축) - 배우자"),
        housingRent: getSpendingAmount("주택자금(월세)"),
        housingLoan: getSpendingAmount("주택자금(임차차입금원리금상환액)"),
        housingMortgage: getSpendingAmount("주택자금(장기주택)"), // 레거시 호환
        housingMortgage15Fixed: getSpendingAmount(
          "주택자금(장기주택)(15년이상 고정금리+비거치식)",
        ),
        housingMortgage15Either: getSpendingAmount(
          "주택자금(장기주택)(15년이상 고정금리 or 비거치식)",
        ),
        housingMortgage15Other: getSpendingAmount(
          "주택자금(장기주택)(15년이상 기타)",
        ),
        housingMortgage10Either: getSpendingAmount(
          "주택자금(장기주택)(10년이상 고정금리 or 비거치식)",
        ),
        pension:
          getSpendingAmount("연금저축") + getSpendingAmount("퇴직연금(IRP)"), // 레거시 호환
        pensionSavings: getSpendingAmount("연금저축"),
        pensionIRP: getSpendingAmount("퇴직연금(IRP)"),
        insurance: getSpendingAmount("보험료"),
        donation: getSpendingAmount("기부금"), // 레거시 호환 (총합)
        donationPolitical: getSpendingAmount("기부금(정치자금)"),
        donationHometown: getSpendingAmount("기부금(고향사랑)"),
        donationDisaster: getSpendingAmount("기부금(고향사랑특별재난)"),
        donationSpecial: getSpendingAmount("기부금(특례기부금)"),
        donationStock: getSpendingAmount("기부금(우리사주조합)"),
        donationReligious: getSpendingAmount("기부금(일반기부금(종교))"),
        donationNonReligious: getSpendingAmount("기부금(일반기부금(종교 외))"),
      },
      spendingItems: spendingItems, // 지출 항목 원본 저장
      updatedAt: new Date().toISOString(),
    };

    await saveAdminData(selectedYear, adminData);
    showNotification("success", "저장되었습니다!");
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemAmount.trim()) {
      showNotification("error", "항목명과 금액을 모두 입력해주세요.");
      return;
    }
    const newItem: SpendingItem = {
      id: Date.now().toString(),
      name: newItemName,
      amount: newItemAmount,
      month: newItemMonth,
    };
    setSpendingItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemMonth(1);
    setShowAddItemModal(false);
    showNotification(
      "success",
      `"${newItemName}" 항목이 ${newItemMonth}월에 추가되었습니다!`,
    );
  };

  const handleDeleteItem = (id: string) => {
    setSpendingItems((prev) => prev.filter((item) => item.id !== id));
    showNotification("success", "항목이 삭제되었습니다.");
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  // Excel Upload Handler - Process file
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const jsonData = await parseSheetToRows(data);

        // Look for salary data in the Excel file
        const newSalaryData: Partial<MonthlySalaryData> = {};

        jsonData.forEach((row) => {
          if (!row || row.length < 2) return;
          const label = String(row[0]).toLowerCase();
          const value = Number(row[1]) || 0;

          if (
            label.includes("총급여") ||
            label.includes("급여") ||
            label.includes("salary")
          ) {
            newSalaryData.totalSalary = formatNumber(value);
          } else if (label.includes("식대") || label.includes("비과세")) {
            newSalaryData.mealAllowance = formatNumber(value);
          } else if (label.includes("국민연금") || label.includes("pension")) {
            newSalaryData.nationalPension = formatNumber(value);
          } else if (label.includes("건강보험") || label.includes("health")) {
            newSalaryData.healthInsurance = formatNumber(value);
          } else if (label.includes("장기요양") || label.includes("long")) {
            newSalaryData.longTermCare = formatNumber(value);
          } else if (
            label.includes("고용보험") ||
            label.includes("employment")
          ) {
            newSalaryData.employmentInsurance = formatNumber(value);
          }
        });

        if (Object.keys(newSalaryData).length > 0) {
          setMonthlySalary((prev) => ({
            ...prev,
            [excelModalMonth]: { ...prev[excelModalMonth], ...newSalaryData },
          }));
          showNotification(
            "success",
            `${excelModalMonth}월 엑셀 데이터를 성공적으로 불러왔습니다!`,
          );
          handleExcelModalClose();
        } else {
          showNotification(
            "error",
            "인식할 수 있는 데이터가 없습니다. 엑셀 형식을 확인해주세요.",
          );
        }
      } catch {
        showNotification("error", "엑셀 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
  };

  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsExcelDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setExcelFile(file);
    } else {
      showNotification("error", "엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.");
    }
  };

  const handleExcelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsExcelDragging(true);
  };

  const handleExcelDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsExcelDragging(false);
  };

  const handleExcelModalClose = () => {
    setShowExcelModal(false);
    setExcelFile(null);
    setIsExcelDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExcelApply = () => {
    if (excelFile) {
      processExcelFile(excelFile);
    }
  };

  // 완전 제외 키워드 목록 (소득공제 불가 - 어디에도 포함 안됨)
  const EXCLUDED_KEYWORDS = [
    // 세금·공과금
    "국세",
    "지방세",
    "전기요금",
    "수도요금",
    "가스요금",
    "아파트관리비",
    "관리비",
    "도로통행료",
    "하이패스",
    "통행료",
    "지자체세입금",
    "자동차세",
    "재산세",
    "주민세",
    "도시가스",
    "한국전력",
    "한전",
    // 통신비
    "휴대전화",
    "휴대폰",
    "핸드폰",
    "인터넷",
    "SKT",
    "KT",
    "LG U+",
    "LGU+",
    "통신",
    "에스케이텔레콤",
    "케이티",
    // 자동차
    "신차",
    "자동차리스",
    "리스료",
    "렌트료",
    // 선승인/가승인 (취소될 예비 승인)
    "선승인",
    "가승인",
  ];

  // 대중교통 키워드 (카드 사용금액에서 제외, 대중교통 항목으로 별도 집계)
  // 참고: 택시는 대중교통 공제 대상이 아님 (일반 카드 사용)
  const PUBLIC_TRANSPORT_KEYWORDS = [
    "버스",
    "지하철",
    "모바일이즐",
    "모바일이즐페이",
    "후불교통",
    "교통카드",
    "티머니",
    "캐시비",
    "코레일",
    "KTX",
    "SRT",
    "철도",
    "고속버스",
    "시외버스",
  ];

  // 보험료 키워드 (카드 사용금액에서 제외, 보험료 항목으로 별도 집계)
  const INSURANCE_KEYWORDS = [
    "보험",
    "메리츠화재",
    "DB손해보험",
    "삼성화재",
    "현대해상",
    "KB손해보험",
    "한화손해보험",
    "국민연금",
    "건강보험",
  ];

  // 의료비 키워드 (카드 사용금액에서 제외, 의료비 항목으로 별도 집계)
  const MEDICAL_KEYWORDS = [
    // 병원/의원
    "병원",
    "의원",
    "클리닉",
    "clinic",
    "hospital",
    "메디컬",
    "medical",
    // 의료법인/재단
    "의료법인",
    "의료재단",
    "의료원",
    // 약국
    "약국",
    "pharmacy",
    "팜",
    // 치과
    "치과",
    "dental",
    "dentist",
    // 한의원
    "한의원",
    "한방",
    // 안과/이비인후과 등
    "안과",
    "이비인후과",
    "피부과",
    "정형외과",
    "내과",
    "외과",
    "소아과",
    "산부인과",
    "비뇨기과",
    // 건강검진센터
    "건강검진",
    "검진센터",
  ];

  // 전통시장은 키워드 매칭 없이 API 기반 전체 검증 (checkMarketApi)

  // 문화체육 키워드 (문화체육 항목으로 별도 집계)
  const CULTURE_SPORTS_KEYWORDS = [
    // 도서
    "서점",
    "도서",
    "북스",
    "books",
    "교보문고",
    "영풍문고",
    "알라딘",
    "예스24",
    // 공연/영화
    "영화관",
    "CGV",
    "롯데시네마",
    "메가박스",
    "극장",
    "공연장",
    "뮤지컬",
    "콘서트",
    // 미술관/박물관
    "미술관",
    "박물관",
    "전시관",
    "갤러리",
    // 체육시설
    "헬스",
    "피트니스",
    "수영장",
    "골프",
    "테니스",
    "볼링",
    "스포츠센터",
    "체육관",
    "요가",
    "필라테스",
  ];

  // 카드사 엑셀 파싱 함수
  const processCardExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const jsonData = await parseSheetToRows(data);

        console.log("Excel data rows:", jsonData.length);
        console.log("First row (header):", jsonData[0]);
        console.log("Second row (data sample):", jsonData[1]);

        if (jsonData.length < 2) {
          showNotification("error", "엑셀 파일에 데이터가 없습니다.");
          return;
        }

        // 헤더 행 찾기 (첫 번째 행 또는 데이터가 시작되는 행)
        let headerRowIndex = 0;
        const firstRow = jsonData[0] || [];

        // 첫 행이 요약 행인지 확인 (예: "총 사용금액: 681,235(원)")
        const firstRowStr = firstRow
          .map((h) => String(h || "").toLowerCase())
          .join(" ");
        const isSummaryFirstRow =
          firstRowStr.includes("총") &&
          (firstRowStr.includes("금액") || firstRowStr.includes("건"));

        // 첫 행이 요약 행이거나 헤더 키워드가 없으면 다음 행들에서 헤더 찾기
        if (
          isSummaryFirstRow ||
          (!firstRowStr.includes("승인") &&
            !firstRowStr.includes("거래일") &&
            !firstRowStr.includes("가맹점") &&
            !firstRowStr.includes("사용처") &&
            !firstRowStr.includes("발행구분"))
        ) {
          // 2~5행 중에서 실제 헤더 행 찾기
          for (let i = 1; i < Math.min(5, jsonData.length); i++) {
            const rowStr = (jsonData[i] || [])
              .map((h) => String(h || "").toLowerCase())
              .join(" ");
            // 헤더 행은 보통 컬럼이 여러 개이고, 헤더 키워드를 포함
            const hasMultipleColumns = (jsonData[i] || []).length >= 3;
            const hasHeaderKeywords =
              rowStr.includes("거래일") ||
              rowStr.includes("가맹점") ||
              rowStr.includes("사용처") ||
              rowStr.includes("상호") ||
              rowStr.includes("승인번호") ||
              rowStr.includes("발행구분");

            if (hasMultipleColumns && hasHeaderKeywords) {
              headerRowIndex = i;
              console.log("Found header row at index:", i);
              break;
            }
          }
        }

        const headerRow = jsonData[headerRowIndex] || [];
        const headers = headerRow.map((h) => String(h || "").toLowerCase());
        console.log("Detected header row index:", headerRowIndex);
        console.log("Headers:", headers);

        // 열 인덱스 찾기 (카드사/현금영수증 양식마다 열 순서가 다름)
        // 날짜 열: 다양한 패턴 지원
        let dateCol = headers.findIndex(
          (h) =>
            h.includes("승인일") ||
            h.includes("이용일") ||
            h.includes("거래일") ||
            h.includes("결제일") ||
            h.includes("매출일") ||
            h.includes("일자") ||
            h.includes("date") ||
            h.includes("날짜") ||
            h.includes("발행일") ||
            h.includes("사용일"),
        );

        // 가맹점 열: 다양한 패턴 지원 (현금영수증 포함)
        let merchantCol = headers.findIndex(
          (h) =>
            h.includes("가맹점") ||
            h.includes("상호") ||
            h.includes("이용처") ||
            h.includes("merchant") ||
            h.includes("매장") ||
            h.includes("사업자") ||
            h.includes("업체") ||
            h.includes("결제처") ||
            h.includes("사용처") ||
            h.includes("상호명"),
        );

        // 금액 열: 다양한 패턴 지원
        let amountCol = headers.findIndex(
          (h) =>
            h.includes("금액") ||
            h.includes("결제금액") ||
            h.includes("이용금액") ||
            h.includes("승인금액") ||
            h.includes("amount") ||
            h.includes("원") ||
            h.includes("사용금액") ||
            h.includes("거래금액") ||
            h.includes("공제금액"),
        );

        // 취소/발행구분 열: 다양한 패턴 지원 (현금영수증 발행구분 포함)
        let cancelCol = headers.findIndex(
          (h) =>
            h.includes("취소") ||
            h.includes("cancel") ||
            h.includes("상태") ||
            h.includes("비고") ||
            h.includes("구분") ||
            h.includes("발행구분") ||
            h.includes("발행유형") ||
            h.includes("거래구분"),
        );

        // 승인번호 열
        let approvalCol = headers.findIndex(
          (h) =>
            h.includes("승인번호") ||
            h.includes("승인no") ||
            h.includes("approval") ||
            h.includes("거래번호") ||
            h.includes("전표번호") ||
            h.includes("현금영수증번호"),
        );

        // 업종/분류 열 (전통시장, 대중교통 구분용)
        const categoryCol = headers.findIndex(
          (h) =>
            h.includes("업종") ||
            h.includes("업태") ||
            h.includes("분류") ||
            h.includes("업종명") ||
            h.includes("카테고리"),
        );

        // 사업자등록번호 열
        let bizNoCol = headers.findIndex(
          (h) =>
            h.includes("사업자등록번호") ||
            h.includes("사업자번호") ||
            h.includes("사업자") ||
            h.includes("등록번호"),
        );
        // 사업자 열이 가맹점 열과 동일하면 제외 ("사업자" 키워드가 가맹점 열에도 포함될 수 있음)
        if (bizNoCol === merchantCol) bizNoCol = -1;

        console.log(
          "Detected columns - date:",
          dateCol,
          "merchant:",
          merchantCol,
          "amount:",
          amountCol,
          "cancel:",
          cancelCol,
          "approval:",
          approvalCol,
          "category:",
          categoryCol,
          "bizNo:",
          bizNoCol,
        );

        // 열을 찾지 못한 경우 스마트 추론
        if (dateCol === -1 || merchantCol === -1 || amountCol === -1) {
          // 데이터 행을 분석하여 열 타입 추론
          const sampleRows = jsonData.slice(
            headerRowIndex + 1,
            headerRowIndex + 10,
          );

          for (
            let colIdx = 0;
            colIdx < (jsonData[headerRowIndex + 1]?.length || 0);
            colIdx++
          ) {
            const sampleValues = sampleRows
              .map((row) => row?.[colIdx])
              .filter((v) => v != null);

            // 날짜 형식 감지 (YYYY-MM-DD, YYYY.MM.DD, YYYYMMDD 등)
            if (dateCol === -1) {
              const datePattern = /^\d{4}[-./]?\d{2}[-./]?\d{2}/;
              const isDateCol = sampleValues.some((v) =>
                datePattern.test(String(v)),
              );
              if (isDateCol) dateCol = colIdx;
            }

            // 금액 열 감지 (숫자만 있거나 원 단위)
            if (amountCol === -1) {
              const numPattern = /^-?\d{1,3}(,\d{3})*$/;
              const isAmountCol = sampleValues.every((v) => {
                const cleanVal = String(v).replace(/[^0-9,-]/g, "");
                return numPattern.test(cleanVal) || !isNaN(Number(v));
              });
              if (isAmountCol && sampleValues.length > 0) {
                const avgLen =
                  sampleValues.reduce(
                    (sum: number, v) => sum + String(v).length,
                    0,
                  ) / sampleValues.length;
                if (avgLen >= 4) amountCol = colIdx; // 최소 4자리 이상 (1000원 이상)
              }
            }

            // 가맹점명 열 감지 (한글 포함, 긴 텍스트)
            if (merchantCol === -1) {
              const koreanPattern = /[가-힣]/;
              const isMerchantCol = sampleValues.every((v) => {
                const str = String(v);
                return koreanPattern.test(str) && str.length >= 2;
              });
              if (isMerchantCol && colIdx !== dateCol && colIdx !== amountCol) {
                merchantCol = colIdx;
              }
            }
          }
        }

        // 여전히 찾지 못한 경우 기본값 사용
        if (dateCol === -1) dateCol = 2;
        if (merchantCol === -1) merchantCol = 4;
        if (amountCol === -1) amountCol = 5;
        if (cancelCol === -1) cancelCol = 9;
        if (approvalCol === -1) approvalCol = 8;

        console.log(
          "Final columns - date:",
          dateCol,
          "merchant:",
          merchantCol,
          "amount:",
          amountCol,
        );

        // 취소된 거래의 승인번호 수집
        const cancelledApprovals = new Set<string>();
        const CANCEL_KEYWORDS = [
          "취소",
          "전체취소",
          "부분취소",
          "cancel",
          "cancelled",
          "void",
          "refund",
          "환불",
          "반품",
          "취소승인",
          "매입취소",
          "승인취소",
          "카드취소",
        ];

        // 1차: 취소 열 기반으로 취소 거래 수집
        jsonData.slice(headerRowIndex + 1).forEach((row) => {
          if (!row) return;
          const cancelValue = row[cancelCol];
          const approvalNum = String(row[approvalCol] || "");

          // 취소여부 열에 "취소" 관련 키워드가 포함된 경우
          const cancelStr = String(cancelValue || "")
            .trim()
            .toLowerCase();
          const isCancelled = CANCEL_KEYWORDS.some((keyword) =>
            cancelStr.includes(keyword),
          );

          if (isCancelled && approvalNum) {
            cancelledApprovals.add(approvalNum);
          }
        });

        // 2차: 가맹점명에 취소 키워드가 있는 경우도 수집
        jsonData.slice(headerRowIndex + 1).forEach((row) => {
          if (!row) return;
          const merchant = String(row[merchantCol] || "").toLowerCase();
          const approvalNum = String(row[approvalCol] || "");

          // 가맹점명에 취소 관련 키워드가 있으면 취소로 처리
          const hasCancelKeyword = CANCEL_KEYWORDS.some((keyword) =>
            merchant.includes(keyword),
          );
          if (hasCancelKeyword && approvalNum) {
            cancelledApprovals.add(approvalNum);
          }
        });

        console.log("Cancelled approvals:", cancelledApprovals.size);

        // [주석처리] 사업자등록번호 캐시 로드 - 추후 적용 여부 결정
        // const BIZ_CACHE_KEY = "taxai_biz_cache";
        // let bizCache: { [bizNo: string]: "medical" | "market" | "card" | "transport" | "insurance" | "culture" } = {};
        // try {
        //     const cached = localStorage.getItem(BIZ_CACHE_KEY);
        //     if (cached) bizCache = JSON.parse(cached);
        // } catch { /* empty */ }
        // let bizCacheHitCount = 0;

        // 데이터 파싱 및 필터링
        const parsedData: {
          date: string;
          merchant: string;
          amount: number;
          excluded: boolean;
          category:
            | "card"
            | "transport"
            | "insurance"
            | "medical"
            | "market"
            | "culture"
            | "excluded";
          approvalNum: string;
          bizNo?: string;
        }[] = [];
        let excludedCnt = 0;
        let skippedCnt = 0;

        jsonData.slice(headerRowIndex + 1).forEach((row) => {
          if (!row || row.length < 3) {
            skippedCnt++;
            return;
          }

          const date = String(row[dateCol] || "");
          const merchant = String(row[merchantCol] || "");
          const amountRaw = row[amountCol];
          const cancelValue =
            cancelCol >= 0 ? String(row[cancelCol] || "").toLowerCase() : "";
          const categoryValue =
            categoryCol >= 0
              ? String(row[categoryCol] || "").toLowerCase()
              : "";

          // 발행구분 체크 - 취소/환불 건 제외
          const CANCEL_ISSUE_KEYWORDS = [
            "취소",
            "환불",
            "반품",
            "cancel",
            "refund",
            "취소발행",
          ];
          const isCancelIssue = CANCEL_ISSUE_KEYWORDS.some((keyword) =>
            cancelValue.includes(keyword),
          );
          if (isCancelIssue) {
            excludedCnt++;
            console.log("❌ 취소/환불 발행 제외:", merchant, cancelValue);
            return;
          }

          // 합계/소계 행 스킵 (엑셀 파일 하단의 총합계 행 제외)
          const SUMMARY_KEYWORDS = [
            "총",
            "합계",
            "소계",
            "total",
            "sum",
            "subtotal",
            "건",
          ];
          const merchantLowerForSummary = merchant.toLowerCase();
          const dateLowerForSummary = date.toLowerCase();

          const isSummaryRow = SUMMARY_KEYWORDS.some(
            (keyword) =>
              merchantLowerForSummary.includes(keyword) ||
              dateLowerForSummary.includes(keyword),
          );

          if (isSummaryRow) {
            console.log("📊 합계 행 제외:", merchant, date);
            skippedCnt++;
            return;
          }

          // 금액 파싱 개선 - 다양한 형식 지원
          let amount = 0;
          let isNegativeAmount = false;
          if (typeof amountRaw === "number") {
            isNegativeAmount = amountRaw < 0;
            amount = Math.abs(amountRaw);
          } else if (amountRaw) {
            const amountStr = String(amountRaw);
            isNegativeAmount =
              amountStr.includes("-") || amountStr.includes("(");
            const cleanedAmount = amountStr.replace(/[^0-9.-]/g, "");
            amount = Math.abs(parseInt(cleanedAmount) || 0);
          }

          const approvalNum = String(row[approvalCol] || "");

          // 사업자등록번호 추출 및 정규화
          let bizNo: string | undefined;
          const hasBizNoColumn = bizNoCol >= 0;
          if (hasBizNoColumn) {
            const rawBizNo = String(row[bizNoCol] || "").replace(/[-\s]/g, "");
            // 10자리 숫자인 경우만 유효한 사업자등록번호
            if (/^\d{10}$/.test(rawBizNo)) {
              bizNo = rawBizNo;
            }
          }

          // 빈 행 스킵
          if (!date && !merchant && amount === 0) {
            skippedCnt++;
            return;
          }

          // 금액이 0이면 스킵
          if (amount === 0) {
            skippedCnt++;
            return;
          }

          // 취소된 승인번호면 스킵
          if (approvalNum && cancelledApprovals.has(approvalNum)) {
            excludedCnt++;
            console.log("❌ 취소 거래 제외 (승인번호):", merchant, approvalNum);
            return;
          }

          // 음수 금액이면 취소로 간주하여 스킵
          if (isNegativeAmount) {
            excludedCnt++;
            console.log("❌ 취소 거래 제외 (음수금액):", merchant);
            return;
          }

          // 가맹점명에 취소 키워드가 있으면 스킵
          const hasCancelInMerchant = CANCEL_KEYWORDS.some((keyword) =>
            merchant.toLowerCase().includes(keyword),
          );
          if (hasCancelInMerchant) {
            excludedCnt++;
            console.log("❌ 취소 거래 제외 (가맹점명):", merchant);
            return;
          }

          // 카테고리 분류
          const merchantLower = merchant.toLowerCase();

          // 대중교통 체크
          const isTransport = PUBLIC_TRANSPORT_KEYWORDS.some((keyword) =>
            merchantLower.includes(keyword.toLowerCase()),
          );

          // 보험료 체크
          const isInsurance = INSURANCE_KEYWORDS.some((keyword) =>
            merchantLower.includes(keyword.toLowerCase()),
          );

          // 의료비 체크 (약국, 병원, 의원 등)
          const isMedical = MEDICAL_KEYWORDS.some((keyword) =>
            merchantLower.includes(keyword.toLowerCase()),
          );

          // 디버깅: 의료비 감지 로그
          if (isMedical) {
            console.log("🏥 의료비 감지:", merchant, "-> medical");
          }

          // 전통시장은 1차 키워드 없이 2차 API로만 검증 (checkMarketApi)

          // 문화체육 체크 (업종 컬럼 또는 가맹점명 기반)
          const isCultureSports = CULTURE_SPORTS_KEYWORDS.some(
            (keyword) =>
              merchantLower.includes(keyword.toLowerCase()) ||
              categoryValue.includes(keyword.toLowerCase()),
          );

          // 업종 컬럼에서 대중교통 추가 체크
          const isTransportFromCategory =
            categoryValue.includes("대중교통") ||
            categoryValue.includes("버스") ||
            categoryValue.includes("지하철") ||
            categoryValue.includes("택시") ||
            categoryValue.includes("철도");

          // 제외 키워드 체크 (세금, 공과금, 통신비 등)
          const isExcludedByKeyword = EXCLUDED_KEYWORDS.some((keyword) =>
            merchantLower.includes(keyword.toLowerCase()),
          );

          // 사업자번호가 없는 항목도 제외 (사업자번호 열이 있는 경우)
          const isExcludedByNoBizNo = hasBizNoColumn && !bizNo;
          if (isExcludedByNoBizNo && !isExcludedByKeyword) {
            console.log("❌ 사업자번호 없음 → 제외:", merchant);
          }

          const isExcluded = isExcludedByKeyword || isExcludedByNoBizNo;

          if (isExcluded) excludedCnt++;

          // 카테고리 결정 (우선순위: 제외 > 대중교통 > 보험 > 의료비 > 문화체육 > 카드)
          // 전통시장은 2차 API 검증으로만 분류됨
          let category:
            | "card"
            | "transport"
            | "insurance"
            | "medical"
            | "market"
            | "culture"
            | "excluded" = "card";
          if (isExcluded) category = "excluded";
          // [주석처리] 캐시 히트 로직 - 추후 적용 여부 결정
          // else if (bizNo && bizCache[bizNo]) {
          //     category = bizCache[bizNo];
          //     bizCacheHitCount++;
          //     console.log(`📋 캐시 히트: ${merchant} (${bizNo}) → ${category}`);
          // }
          else if (isTransport || isTransportFromCategory)
            category = "transport";
          else if (isInsurance) category = "insurance";
          else if (isMedical) category = "medical";
          else if (isCultureSports) category = "culture";

          console.log(
            "분류 결과:",
            merchant,
            bizNo ? `(${bizNo})` : "",
            "->",
            category,
          );

          parsedData.push({
            date,
            merchant,
            amount,
            excluded: isExcluded,
            category,
            approvalNum,
            bizNo,
          });
        });

        const bizNoCount = parsedData.filter((d) => d.bizNo).length;
        console.log(
          "Parsed data count:",
          parsedData.length,
          "Excluded:",
          excludedCnt,
          "Skipped:",
          skippedCnt,
          "BizNo:",
          bizNoCount,
        );

        // 📋 국세청 사업자등록번호 상태 조회 (면세사업자 판별)
        const checkBizStatus = async () => {
          // bizNo가 있고 아직 미분류(card)인 항목만 조회
          const uncachedBizItems = parsedData.filter(
            (item) => item.bizNo && item.category === "card",
          );

          // 중복 제거된 사업자번호 목록
          const uniqueBizNos = [
            ...new Set(uncachedBizItems.map((item) => item.bizNo!)),
          ];

          if (uniqueBizNos.length === 0) {
            console.log(
              "📋 국세청 조회: 조회할 사업자번호 없음 (전체 캐시 히트)",
            );
            return;
          }

          console.log(
            `📋 국세청 사업자 상태 조회 시작: ${uniqueBizNos.length}개 사업자번호`,
          );

          try {
            const response = await fetch("/api/biz-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bizNumbers: uniqueBizNos }),
            });

            if (!response.ok) {
              console.warn("📋 국세청 API 호출 실패:", response.status);
              return;
            }

            const result = await response.json();
            console.log("📋 국세청 API 응답:", result);

            // 면세사업자 판별 → 의료비 키워드와 조합하여 의료기관 판정
            let reclassifiedCount = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.results?.forEach((r: any) => {
              if (r.isTaxFree) {
                // 면세사업자인 항목들을 찾아서 의료비로 재분류
                parsedData.forEach((item) => {
                  if (item.bizNo === r.bizNo && item.category === "card") {
                    const merchantLower = item.merchant.toLowerCase();
                    // 면세 + 의료 키워드 = 의료비 확정
                    const medicalHint = MEDICAL_KEYWORDS.some((kw) =>
                      merchantLower.includes(kw.toLowerCase()),
                    );
                    if (medicalHint) {
                      item.category = "medical";
                      reclassifiedCount++;
                      console.log(
                        `✅ 면세사업자+의료키워드 → 의료비: ${item.merchant} (${r.bizNo})`,
                      );
                    } else {
                      // 면세사업자이지만 의료 키워드 없음 → 가맹점명 API에서 추가 판별 예정
                      console.log(
                        `📋 면세사업자 (미분류): ${item.merchant} (${r.bizNo}) - ${r.taxType}`,
                      );
                    }
                  }
                });
              }
            });

            if (reclassifiedCount > 0) {
              showNotification(
                "success",
                `📋 국세청 검증: ${reclassifiedCount}개 의료기관 확인 (면세사업자)`,
              );
              setCardExcelPreview([...parsedData]);
            }
          } catch (error) {
            console.error("📋 국세청 API 오류:", error);
          }
        };

        // 🏥 약국 API 2차 검증 - 모든 가맹점 API 기반 검증 (키워드 필터 없음)
        const checkPharmacyApi = async () => {
          // excluded 제외한 모든 가맹점을 API로 보냄
          const allItems = parsedData.filter(
            (item) => item.category !== "excluded",
          );

          if (allItems.length === 0) {
            console.log("🏥 약국 2차 검증: 검증할 항목 없음");
            return;
          }

          console.log(
            `🏥 약국 API 2차 검증 시작: ${allItems.length}개 가맹점 (전체)`,
          );

          try {
            const response = await fetch("/api/pharmacy", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ names: allItems.map((p) => p.merchant) }),
            });

            if (!response.ok) {
              console.warn("🏥 약국 API 호출 실패:", response.status);
              return;
            }

            const result = await response.json();
            console.log("🏥 약국 API 응답:", result);

            // API 결과 로깅 및 카테고리 업데이트
            let verifiedCount = 0;
            let reclassifiedCount = 0;
            result.results?.forEach(
              (r: { name: string; isPharmacy: boolean; reason?: string }) => {
                const item = parsedData.find((p) => p.merchant === r.name);
                if (r.isPharmacy) {
                  verifiedCount++;
                  if (item && item.category !== "medical") {
                    const prevCategory = item.category;
                    item.category = "medical";
                    reclassifiedCount++;
                    console.log(
                      `✅ 약국 API 검증 → 의료비 재분류: ${r.name} (${prevCategory} → medical)`,
                    );
                  } else {
                    console.log(
                      `✅ 약국 API 검증 확인: ${r.name} (이미 의료비)`,
                    );
                  }
                }
              },
            );

            if (verifiedCount > 0 || reclassifiedCount > 0) {
              showNotification(
                "success",
                `🏥 약국 API 검증: ${verifiedCount}개 약국 확인` +
                  (reclassifiedCount > 0
                    ? `, ${reclassifiedCount}개 재분류`
                    : ""),
              );
            }

            if (reclassifiedCount > 0) {
              setCardExcelPreview([...parsedData]);
            }
          } catch (error) {
            console.error("🏥 약국 API 오류:", error);
          }
        };

        // 🏥 병원 API 2차 검증 - 모든 가맹점 API 기반 검증 (키워드 필터 없음)
        const checkHospitalApi = async () => {
          // excluded 제외한 모든 가맹점을 API로 보냄
          const allItems = parsedData.filter(
            (item) => item.category !== "excluded",
          );

          if (allItems.length === 0) {
            console.log("🏥 병원 2차 검증: 검증할 항목 없음");
            return;
          }

          console.log(
            `🏥 병원 API 2차 검증 시작: ${allItems.length}개 가맹점 (전체)`,
          );

          try {
            const response = await fetch("/api/hospital", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ names: allItems.map((p) => p.merchant) }),
            });

            if (!response.ok) {
              console.warn("🏥 병원 API 호출 실패:", response.status);
              return;
            }

            const result = await response.json();
            console.log("🏥 병원 API 응답:", result);

            let verifiedCount = 0;
            let reclassifiedCount = 0;
            result.results?.forEach(
              (r: { name: string; isHospital: boolean; reason?: string }) => {
                const item = parsedData.find((p) => p.merchant === r.name);
                if (r.isHospital) {
                  verifiedCount++;
                  if (item && item.category !== "medical") {
                    const prevCategory = item.category;
                    item.category = "medical";
                    reclassifiedCount++;
                    console.log(
                      `✅ 병원 API 검증 → 의료비 재분류: ${r.name} (${prevCategory} → medical)`,
                    );
                  } else {
                    console.log(
                      `✅ 병원 API 검증 확인: ${r.name} (이미 의료비)`,
                    );
                  }
                }
              },
            );

            if (verifiedCount > 0 || reclassifiedCount > 0) {
              showNotification(
                "success",
                `🏥 병원 API 검증: ${verifiedCount}개 병원 확인` +
                  (reclassifiedCount > 0
                    ? `, ${reclassifiedCount}개 재분류`
                    : ""),
              );
            }

            if (reclassifiedCount > 0) {
              setCardExcelPreview([...parsedData]);
            }
          } catch (error) {
            console.error("🏥 병원 API 오류:", error);
          }
        };

        // 🏪 전통시장 API 2차 검증 - 모든 가맹점 API 기반 검증 (키워드 필터 없음)
        const checkMarketApi = async () => {
          // excluded 제외한 모든 가맹점을 API로 보냄
          const allItems = parsedData.filter(
            (item) => item.category !== "excluded",
          );

          if (allItems.length === 0) {
            console.log("🏪 전통시장 2차 검증: 검증할 항목 없음");
            return;
          }

          console.log(
            `🏪 전통시장 API 2차 검증 시작: ${allItems.length}개 가맹점 (전체)`,
          );

          try {
            const response = await fetch("/api/market", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ names: allItems.map((p) => p.merchant) }),
            });

            if (!response.ok) {
              console.warn("🏪 전통시장 API 호출 실패:", response.status);
              return;
            }

            const result = await response.json();
            console.log("🏪 전통시장 API 응답:", result);

            let verifiedCount = 0;
            let reclassifiedCount = 0;
            const newUncertainItems: typeof uncertainMarketItems = [];

            result.results?.forEach(
              (r: {
                name: string;
                isMarket: boolean;
                reason?: string;
                marketName?: string;
                belongsTo?: string;
                address?: string;
                confidence?: "confirmed" | "uncertain";
                matchRatio?: number;
                candidates?: Array<{
                  marketName: string;
                  belongsTo: string;
                  address: string;
                }>;
              }) => {
                const item = parsedData.find((p) => p.merchant === r.name);

                if (r.isMarket && r.confidence === "confirmed") {
                  verifiedCount++;
                  // 이미 의료비, 교통비 등으로 분류된 항목은 보존 (card만 재분류)
                  if (item && item.category === "card") {
                    item.category = "market";
                    reclassifiedCount++;
                    console.log(
                      `✅ 전통시장 API 검증 → 전통시장 재분류: ${r.name} (card → market, 시장명: ${r.marketName})`,
                    );
                  } else if (item && item.category === "market") {
                    console.log(
                      `✅ 전통시장 API 검증 확인: ${r.name} (이미 전통시장, 시장명: ${r.marketName})`,
                    );
                  } else if (item) {
                    console.log(
                      `ℹ️ 전통시장 API 매칭되었으나 기존 분류 유지: ${r.name} (${item.category}, 시장명: ${r.marketName})`,
                    );
                  }
                } else if (
                  r.reason === "api_uncertain" &&
                  r.confidence === "uncertain"
                ) {
                  // 불확실 매칭 - card인 경우만 사용자 확인 요청
                  if (item && item.category === "card") {
                    console.log(
                      `❓ 전통시장 API 불확실 매칭: ${r.name} → ${r.marketName} (${r.belongsTo}), 매칭률: ${((r.matchRatio || 0) * 100).toFixed(0)}%`,
                    );
                    newUncertainItems.push({
                      merchantName: r.name,
                      matchedMarketName: r.marketName || "",
                      belongsTo: r.belongsTo || "",
                      address: r.address || "",
                      matchRatio: r.matchRatio || 0,
                      candidates: r.candidates,
                    });
                  }
                }
              },
            );

            if (verifiedCount > 0 || reclassifiedCount > 0) {
              showNotification(
                "success",
                `🏪 전통시장 API 검증: ${verifiedCount}개 전통시장 확인` +
                  (reclassifiedCount > 0
                    ? `, ${reclassifiedCount}개 재분류`
                    : "") +
                  (newUncertainItems.length > 0
                    ? `, ${newUncertainItems.length}개 확인 필요`
                    : ""),
              );
            }

            if (reclassifiedCount > 0) {
              setCardExcelPreview([...parsedData]);
            }

            // 불확실 매칭이 있으면 확인 모달 표시
            if (newUncertainItems.length > 0) {
              setUncertainMarketItems(newUncertainItems);
              setShowMarketConfirmModal(true);
            }
          } catch (error) {
            console.error("🏪 전통시장 API 오류:", error);
          }
        };

        // [주석처리] 사업자등록번호 캐시 저장 함수 - 추후 적용 여부 결정
        // const saveBizCache = () => {
        //     try {
        //         let updatedCount = 0;
        //         parsedData.forEach(item => {
        //             if (item.bizNo && item.category !== "excluded" && item.category !== "card") {
        //                 if (!bizCache[item.bizNo] || bizCache[item.bizNo] !== item.category) {
        //                     bizCache[item.bizNo] = item.category;
        //                     updatedCount++;
        //                 }
        //             }
        //         });
        //         if (updatedCount > 0) {
        //             localStorage.setItem(BIZ_CACHE_KEY, JSON.stringify(bizCache));
        //             console.log(`📋 사업자번호 캐시 업데이트: ${updatedCount}건 저장 (총 ${Object.keys(bizCache).length}건)`);
        //         }
        //     } catch (e) {
        //         console.error("캐시 저장 오류:", e);
        //     }
        // };

        // 배치 API 호출 (비동기) → 국세청 먼저 → 나머지 병렬
        checkBizStatus().then(() =>
          Promise.all([
            checkPharmacyApi(),
            checkHospitalApi(),
            checkMarketApi(),
          ]),
        );

        // 디버깅: 카테고리별 합계 출력
        const cardTotal = parsedData
          .filter((i) => i.category === "card")
          .reduce((s, i) => s + i.amount, 0);
        const transportTotal = parsedData
          .filter((i) => i.category === "transport")
          .reduce((s, i) => s + i.amount, 0);
        const insuranceTotal = parsedData
          .filter((i) => i.category === "insurance")
          .reduce((s, i) => s + i.amount, 0);
        const medicalTotal = parsedData
          .filter((i) => i.category === "medical")
          .reduce((s, i) => s + i.amount, 0);
        const marketTotal = parsedData
          .filter((i) => i.category === "market")
          .reduce((s, i) => s + i.amount, 0);
        const cultureTotal = parsedData
          .filter((i) => i.category === "culture")
          .reduce((s, i) => s + i.amount, 0);
        const excludedTotal = parsedData
          .filter((i) => i.category === "excluded")
          .reduce((s, i) => s + i.amount, 0);
        const grandTotal = parsedData.reduce((s, i) => s + i.amount, 0);

        console.log("=== 카테고리별 합계 ===");
        console.log("신용카드:", cardTotal.toLocaleString());
        console.log("대중교통:", transportTotal.toLocaleString());
        console.log("보험료:", insuranceTotal.toLocaleString());
        console.log("의료비:", medicalTotal.toLocaleString());
        console.log("전통시장:", marketTotal.toLocaleString());
        console.log("문화체육:", cultureTotal.toLocaleString());
        console.log("제외:", excludedTotal.toLocaleString());
        console.log("총합계:", grandTotal.toLocaleString());
        console.log("======================");
        if (parsedData.length === 0) {
          showNotification(
            "error",
            `파싱된 데이터가 없습니다. (스킵: ${skippedCnt}건, 제외: ${excludedCnt}건)`,
          );
        } else {
          showNotification(
            "success",
            `${parsedData.length}건의 거래 데이터를 찾았습니다.`,
          );
        }

        setCardExcelPreview(parsedData); // 전체 데이터 저장 (합계 계산용)
        setExcludedCount(excludedCnt);
      } catch (error) {
        console.error("Excel parsing error:", error);
        showNotification("error", "엑셀 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 카드사 엑셀 업로드 핸들러
  const handleCardExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCardExcelFile(file);
    processCardExcelFile(file);
  };

  const handleCardExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCardExcelDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setCardExcelFile(file);
      processCardExcelFile(file);
    }
  };

  const handleCardExcelModalOpen = () => {
    setShowCardExcelModal(true);
    setCardExcelFile(null);
    setCardExcelPreview([]);
    setExcludedCount(0);
    setCardType("credit");
  };

  const handleCardExcelModalClose = () => {
    setShowCardExcelModal(false);
    setCardExcelFile(null);
    setCardExcelPreview([]);
    if (cardExcelInputRef.current) {
      cardExcelInputRef.current.value = "";
    }
  };

  const handleCardExcelApply = () => {
    if (!cardExcelFile || cardExcelPreview.length === 0) return;

    // 카테고리별 금액 합계 계산
    const cardAmount = cardExcelPreview
      .filter((item) => item.category === "card")
      .reduce((sum, item) => sum + item.amount, 0);

    const transportAmount = cardExcelPreview
      .filter((item) => item.category === "transport")
      .reduce((sum, item) => sum + item.amount, 0);

    const insuranceAmount = cardExcelPreview
      .filter((item) => item.category === "insurance")
      .reduce((sum, item) => sum + item.amount, 0);

    const medicalAmount = cardExcelPreview
      .filter((item) => item.category === "medical")
      .reduce((sum, item) => sum + item.amount, 0);

    const marketAmount = cardExcelPreview
      .filter((item) => item.category === "market")
      .reduce((sum, item) => sum + item.amount, 0);

    const cultureAmount = cardExcelPreview
      .filter((item) => item.category === "culture")
      .reduce((sum, item) => sum + item.amount, 0);

    // 카테고리별 세부 내역 추출
    const cardDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "card")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    const transportDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "transport")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    const insuranceDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "insurance")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    const medicalDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "medical")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    const marketDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "market")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    const cultureDetails: TransactionDetail[] = cardExcelPreview
      .filter((item) => item.category === "culture")
      .map((item) => ({
        date: item.date,
        merchant: item.merchant,
        amount: item.amount,
      }));

    // 카드 타입에 따른 이름
    const cardName =
      cardType === "credit"
        ? "신용카드"
        : cardType === "debit"
          ? "직불카드"
          : "현금영수증";

    // 항목 추가 헬퍼 함수 (세부 내역 포함)
    const addOrUpdateItem = (
      name: string,
      amount: number,
      details: TransactionDetail[],
    ) => {
      if (amount <= 0) return;

      setSpendingItems((prev) => {
        // 같은 월, 같은 이름의 항목 찾기
        const existingIndex = prev.findIndex(
          (item) => item.name === name && item.month === selectedSpendingMonth,
        );
        if (existingIndex >= 0) {
          const currentAmount = parseInt(
            prev[existingIndex].amount.replace(/[^0-9]/g, "") || "0",
          );
          const newAmount = currentAmount + amount;
          const existingDetails = prev[existingIndex].details || [];
          return prev.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  amount: newAmount.toLocaleString("ko-KR"),
                  details: [...existingDetails, ...details],
                }
              : item,
          );
        } else {
          return [
            ...prev,
            {
              id: Date.now().toString() + name + selectedSpendingMonth,
              name,
              amount: amount.toLocaleString("ko-KR"),
              month: selectedSpendingMonth,
              details,
            },
          ];
        }
      });
    };

    // 각 카테고리별로 항목 추가 (세부 내역 포함)
    addOrUpdateItem(cardName, cardAmount, cardDetails);
    addOrUpdateItem("대중교통", transportAmount, transportDetails);
    addOrUpdateItem("보험료", insuranceAmount, insuranceDetails);
    addOrUpdateItem("의료비", medicalAmount, medicalDetails);
    addOrUpdateItem("전통시장", marketAmount, marketDetails);
    addOrUpdateItem("문화체육", cultureAmount, cultureDetails);

    // 결과 메시지
    const messages = [];
    if (cardAmount > 0)
      messages.push(`${cardName} ${cardAmount.toLocaleString("ko-KR")}원`);
    if (transportAmount > 0)
      messages.push(`대중교통 ${transportAmount.toLocaleString("ko-KR")}원`);
    if (insuranceAmount > 0)
      messages.push(`보험료 ${insuranceAmount.toLocaleString("ko-KR")}원`);
    if (medicalAmount > 0)
      messages.push(`의료비 ${medicalAmount.toLocaleString("ko-KR")}원`);
    if (marketAmount > 0)
      messages.push(`전통시장 ${marketAmount.toLocaleString("ko-KR")}원`);
    if (cultureAmount > 0)
      messages.push(`문화체육 ${cultureAmount.toLocaleString("ko-KR")}원`);

    showNotification(
      "success",
      `${messages.join(", ")} 추가됨 (제외: ${excludedCount}건)`,
    );
    handleCardExcelModalClose();
  };

  // OCR Image Upload Functions
  const processImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const maxImages = 10;
    const currentCount = capturedImages.length;
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      showNotification("error", `최대 ${maxImages}개까지 업로드 가능합니다.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: string[] = [];

    // 이미지 파일 읽기
    for (const file of filesToProcess) {
      if (file.type.startsWith("image/")) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }
    }

    if (newImages.length === 0) return;

    setCapturedImages((prev) => [...prev, ...newImages]);

    // 자동 OCR 처리
    setIsOcrProcessing(true);
    showNotification("success", `${newImages.length}개 이미지 분석 중...`);

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: newImages }),
      });

      if (!response.ok) {
        throw new Error("OCR API 요청 실패");
      }

      const data = await response.json();

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // 선택한 카드 타입에 맞게 기본 카테고리 적용
        const cardTypeToCategory: { [key: string]: string } = {
          credit: "신용카드",
          debit: "직불카드",
          cash: "현금영수증",
        };
        const defaultCategory = cardTypeToCategory[ocrCardType];

        const adjustedItems = data.items.map(
          (item: { category: string; merchant: string; amount: number }) => ({
            ...item,
            // AI가 특수 카테고리(교통, 의료 등)를 감지하지 않았으면 선택한 카드 타입 적용
            category: [
              "신용카드",
              "체크카드",
              "현금영수증",
              "직불카드",
            ].includes(item.category)
              ? defaultCategory
              : item.category,
          }),
        );

        // 중복 방지: 동일한 가맹점+금액 조합 필터링
        // 1. 새로 추가될 항목들 간의 중복을 추적 (같은 이미지가 여러 번 업로드된 경우)
        const seenItems: { [key: string]: boolean } = {};
        const uniqueAdjustedItems: {
          category: string;
          merchant: string;
          amount: number;
        }[] = [];
        const internalDuplicateList: { merchant: string; amount: number }[] =
          [];

        adjustedItems.forEach(
          (item: { category: string; merchant: string; amount: number }) => {
            const key = `${item.merchant}-${item.amount}`;
            if (!seenItems[key]) {
              seenItems[key] = true;
              uniqueAdjustedItems.push(item);
            } else {
              // 중복 항목 기록
              internalDuplicateList.push({
                merchant: item.merchant,
                amount: item.amount,
              });
            }
          },
        );

        // 2. 기존 항목과의 중복 제거
        setOcrPreviewItems((prev) => {
          const externalDuplicateList: { merchant: string; amount: number }[] =
            [];

          const newItems = uniqueAdjustedItems.filter((newItem) => {
            const exists = prev.some(
              (existing) =>
                existing.merchant === newItem.merchant &&
                existing.amount === newItem.amount,
            );
            if (exists) {
              externalDuplicateList.push({
                merchant: newItem.merchant,
                amount: newItem.amount,
              });
            }
            return !exists;
          });

          // 모든 중복 항목 합치기
          const allDuplicates = [
            ...internalDuplicateList,
            ...externalDuplicateList,
          ];

          if (allDuplicates.length > 0) {
            setOcrDuplicateItems((prevItems) => [
              ...prevItems,
              ...allDuplicates,
            ]);

            if (newItems.length > 0) {
              showNotification(
                "success",
                `${newItems.length}개 항목 추가 (${allDuplicates.length}개 중복 제외)`,
              );
            } else {
              showNotification("error", "모든 항목이 이미 추가되어 있습니다.");
            }
          } else if (newItems.length > 0) {
            showNotification(
              "success",
              `${newItems.length}개 항목이 자동 인식되었습니다!`,
            );
          }

          return [...prev, ...newItems];
        });
      } else {
        showNotification("error", "이미지에서 지출 항목을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      showNotification("error", "OCR 분석에 실패했습니다.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleOcrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processImageFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processImageFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOcrModalOpen = () => {
    setShowCameraModal(true);
    setCapturedImages([]);
    setOcrModalMonth(selectedMonth);
    setOcrPreviewItems([]);
    setOcrCardType("credit");
    setOcrDuplicateItems([]);
  };

  const handleOcrModalClose = () => {
    setShowCameraModal(false);
    setCapturedImages([]);
    setOcrPreviewItems([]);
    setIsDragging(false);
    if (ocrImageInputRef.current) {
      ocrImageInputRef.current.value = "";
    }
  };

  // OCR 수동 입력 항목 삭제
  const handleRemoveOcrItem = (index: number) => {
    setOcrPreviewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseImage = () => {
    if (ocrPreviewItems.length === 0) {
      showNotification("error", "최소 1개 이상의 항목을 입력해주세요.");
      return;
    }

    // 카테고리별 금액 합계 및 세부 내역 추출
    const categoryTotals: {
      [key: string]: { amount: number; details: TransactionDetail[] };
    } = {};

    ocrPreviewItems.forEach((item) => {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = { amount: 0, details: [] };
      }
      categoryTotals[item.category].amount += item.amount;
      categoryTotals[item.category].details.push({
        date: new Date().toISOString().split("T")[0],
        merchant: item.merchant,
        amount: item.amount,
      });
    });

    // 항목 추가 헬퍼 함수
    const addOrUpdateItem = (
      name: string,
      amount: number,
      details: TransactionDetail[],
    ) => {
      if (amount <= 0) return;
      setSpendingItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.name === name && i.month === selectedSpendingMonth,
        );
        if (existingIndex >= 0) {
          const currentAmount = parseInt(
            prev[existingIndex].amount.replace(/[^0-9]/g, "") || "0",
          );
          const newAmount = currentAmount + amount;
          const existingDetails = prev[existingIndex].details || [];
          return prev.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  amount: newAmount.toLocaleString("ko-KR"),
                  details: [...existingDetails, ...details],
                }
              : item,
          );
        } else {
          return [
            ...prev,
            {
              id: Date.now().toString() + name + selectedSpendingMonth,
              name,
              amount: amount.toLocaleString("ko-KR"),
              month: selectedSpendingMonth,
              details,
            },
          ];
        }
      });
    };

    // 각 카테고리별로 항목 추가
    Object.entries(categoryTotals).forEach(([category, data]) => {
      addOrUpdateItem(category, data.amount, data.details);
    });

    // 결과 메시지
    const messages = Object.entries(categoryTotals).map(
      ([cat, data]) => `${cat} ${data.amount.toLocaleString("ko-KR")}원`,
    );
    showNotification("success", `${messages.join(", ")} 추가됨`);
    handleOcrModalClose();
  };

  const handleSalaryInputChange = (
    field: keyof MonthlySalaryData,
    value: string,
  ) => {
    // 숫자만 추출 후 천원단위 포맷팅
    const numericValue = value.replace(/[^0-9]/g, "");
    const formatted = numericValue
      ? parseInt(numericValue).toLocaleString("ko-KR")
      : "0";

    setMonthlySalary((prev) => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        [field]: formatted,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-40 md:pb-0">
      {/* Hidden file input for Excel upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelUpload}
        className="hidden"
      />

      {/* Notification Toast - 저장 버튼 위에 표시 */}
      {notification && (
        <div
          className={clsx(
            "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 border-2 border-black shadow-md animate-fade-in md:bottom-28",
            notification.type === "success" ? "bg-fresh-green" : "bg-ink-black",
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black">수동 항목 추가</h3>
                <button
                  onClick={() =>
                    handleButtonClick("modalClose", () =>
                      setShowAddItemModal(false),
                    )
                  }
                  className={clsx(
                    "p-2 border-2 border-black shadow-sm transition-all",
                    clickedBtn === "modalClose"
                      ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">월 선택</label>
                  <select
                    className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                    value={newItemMonth}
                    onChange={(e) => setNewItemMonth(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2">항목명</label>
                  <select
                    className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  >
                    <option value="">-- 항목 선택 --</option>
                    <option value="신용카드">💳 신용카드</option>
                    <option value="직불카드">💳 직불카드</option>
                    <option value="현금영수증">🧾 현금영수증</option>
                    <option value="대중교통">🚌 대중교통</option>
                    <option value="보험료">🛡 보험료</option>
                    <option value="의료비(난임시술비)">
                      🏥 의료비(난임시술비)
                    </option>
                    <option value="의료비(미숙아,선천성)">
                      🏥 의료비(미숙아,선천성)
                    </option>
                    <option value="의료비(본인,장애,65세,6세)">
                      🏥 의료비(본인,장애,65세,6세)
                    </option>
                    <option value="의료비(그밖부양가족)">
                      🏥 의료비(그밖부양가족)
                    </option>
                    <option value="교육비(본인)">📚 교육비(본인)</option>
                    <option value="교육비(미취학)-자녀1">
                      📚 교육비(미취학)-자녀1
                    </option>
                    <option value="교육비(미취학)-자녀2">
                      📚 교육비(미취학)-자녀2
                    </option>
                    <option value="교육비(미취학)-자녀3">
                      📚 교육비(미취학)-자녀3
                    </option>
                    <option value="교육비(초중고)-자녀1">
                      📚 교육비(초중고)-자녀1
                    </option>
                    <option value="교육비(초중고)-자녀2">
                      📚 교육비(초중고)-자녀2
                    </option>
                    <option value="교육비(초중고)-자녀3">
                      📚 교육비(초중고)-자녀3
                    </option>
                    <option value="교육비(대학)-자녀1">
                      📚 교육비(대학)-자녀1
                    </option>
                    <option value="교육비(대학)-자녀2">
                      📚 교육비(대학)-자녀2
                    </option>
                    <option value="교육비(대학)-자녀3">
                      📚 교육비(대학)-자녀3
                    </option>
                    <option value="전통시장">🏪 전통시장</option>
                    <option value="문화체육">🎭 문화체육</option>
                    <option value="기부금(정치자금)">
                      🎗️ 기부금(정치자금)
                    </option>
                    <option value="기부금(고향사랑)">
                      🎗️ 기부금(고향사랑)
                    </option>
                    <option value="기부금(고향사랑특별재난)">
                      🎗️ 기부금(고향사랑특별재난)
                    </option>
                    <option value="기부금(특례기부금)">
                      🎗️ 기부금(특례기부금)
                    </option>
                    <option value="기부금(우리사주조합)">
                      🎗️ 기부금(우리사주조합)
                    </option>
                    <option value="기부금(일반기부금(종교))">
                      🎗️ 기부금(일반기부금(종교))
                    </option>
                    <option value="기부금(일반기부금(종교 외))">
                      🎗️ 기부금(일반기부금(종교 외))
                    </option>
                    <option value="연금저축">💰 연금저축</option>
                    <option value="퇴직연금(IRP)">🏦 퇴직연금(IRP)</option>
                    <option
                      value="주택자금(청약저축) - 세대주"
                      disabled={
                        Object.values(monthlySalary).reduce(
                          (sum, m) =>
                            sum +
                            parseInt(
                              m.totalSalary.replace(/[^0-9]/g, "") || "0",
                            ),
                          0,
                        ) > 70000000
                      }
                    >
                      🏠 주택자금(청약저축) - 세대주{" "}
                      {Object.values(monthlySalary).reduce(
                        (sum, m) =>
                          sum +
                          parseInt(m.totalSalary.replace(/[^0-9]/g, "") || "0"),
                        0,
                      ) > 70000000
                        ? "(총급여 7천만원 이하만)"
                        : ""}
                    </option>
                    <option
                      value="주택자금(청약저축) - 배우자"
                      disabled={
                        Object.values(monthlySalary).reduce(
                          (sum, m) =>
                            sum +
                            parseInt(
                              m.totalSalary.replace(/[^0-9]/g, "") || "0",
                            ),
                          0,
                        ) > 70000000
                      }
                    >
                      🏠 주택자금(청약저축) - 배우자{" "}
                      {Object.values(monthlySalary).reduce(
                        (sum, m) =>
                          sum +
                          parseInt(m.totalSalary.replace(/[^0-9]/g, "") || "0"),
                        0,
                      ) > 70000000
                        ? "(총급여 7천만원 이하만)"
                        : ""}
                    </option>
                    <option value="주택자금(월세)">🏠 주택자금(월세)</option>
                    <option value="주택자금(임차차입금원리금상환액)">
                      🏠 주택자금(임차차입금원리금상환액)
                    </option>
                    <option value="주택자금(장기주택)(15년이상 고정금리+비거치식)">
                      🏠 주택자금(장기주택)(15년이상 고정금리+비거치식)
                    </option>
                    <option value="주택자금(장기주택)(15년이상 고정금리 or 비거치식)">
                      🏠 주택자금(장기주택)(15년이상 고정금리 or 비거치식)
                    </option>
                    <option value="주택자금(장기주택)(15년이상 기타)">
                      🏠 주택자금(장기주택)(15년이상 기타)
                    </option>
                    <option value="주택자금(장기주택)(10년이상 고정금리 or 비거치식)">
                      🏠 주택자금(장기주택)(10년이상 고정금리 or 비거치식)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-2">금액 (원)</label>
                  <input
                    type="text"
                    className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                    placeholder="예: 500,000"
                    value={newItemAmount}
                    onChange={(e) => {
                      // 숫자만 추출 후 천 단위 포맷
                      const numericValue = e.target.value.replace(
                        /[^0-9]/g,
                        "",
                      );
                      const formatted = numericValue
                        ? parseInt(numericValue).toLocaleString("ko-KR")
                        : "";
                      setNewItemAmount(formatted);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() =>
                    handleButtonClick("modalCancel", () =>
                      setShowAddItemModal(false),
                    )
                  }
                  className={clsx(
                    "flex-1 py-3 font-bold border-2 border-black shadow-md transition-all",
                    clickedBtn === "modalCancel"
                      ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                      : "bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                  )}
                >
                  취소
                </button>
                <button
                  onClick={() => handleButtonClick("modalAdd", handleAddItem)}
                  className={clsx(
                    "flex-1 py-3 font-bold border-2 border-black shadow-md transition-all",
                    clickedBtn === "modalAdd"
                      ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                      : "bg-fresh-green hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                  )}
                >
                  추가
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* OCR Image Upload Modal */}
      {showCameraModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
                <h3 className="text-xl font-black">이미지 업로드 (OCR)</h3>
                <button
                  onClick={() =>
                    handleButtonClick("ocrModalClose", handleOcrModalClose)
                  }
                  className={clsx(
                    "p-2 border-2 border-black shadow-sm transition-all",
                    clickedBtn === "ocrModalClose"
                      ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 카드 타입 탭 */}
              <p className="font-bold text-base mb-2">📋 사용 내역 선택</p>
              <div className="flex gap-2 mb-4">
                {[
                  {
                    type: "credit" as const,
                    label: "💳 신용카드",
                    btnId: "ocrTabCredit",
                  },
                  {
                    type: "debit" as const,
                    label: "💳 직불카드",
                    btnId: "ocrTabDebit",
                  },
                  {
                    type: "cash" as const,
                    label: "🧾 현금영수증",
                    btnId: "ocrTabCash",
                  },
                ].map(({ type, label, btnId }) => (
                  <button
                    key={type}
                    onClick={() =>
                      handleButtonClick(
                        btnId,
                        () => !capturedImages.length && setOcrCardType(type),
                      )
                    }
                    disabled={capturedImages.length > 0 && ocrCardType !== type}
                    className={clsx(
                      "flex-1 py-3 font-bold border-2 border-black transition-all",
                      ocrCardType === type
                        ? clickedBtn === btnId
                          ? "bg-fresh-green translate-x-[3px] translate-y-[3px] shadow-none"
                          : "bg-fresh-green shadow-sm"
                        : capturedImages.length > 0
                          ? "bg-gray-200 cursor-not-allowed opacity-50"
                          : clickedBtn === btnId
                            ? "bg-highlight-orange/30 translate-x-[2px] translate-y-[2px] shadow-none"
                            : "bg-white hover:bg-gray-100 shadow-sm",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 드래그앤드롭 영역 */}
              <div
                className={clsx(
                  "min-h-[200px] mb-6 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                  isDragging
                    ? "border-fresh-green bg-highlight-green/30 scale-[1.02]"
                    : "border-gray-400 bg-gray-50 hover:bg-gray-100",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => ocrImageInputRef.current?.click()}
              >
                {capturedImages.length > 0 ? (
                  <div className="w-full p-4">
                    <p className="text-center text-sm font-bold mb-3">
                      {capturedImages.length}개 이미지 업로드됨
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {capturedImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square border-2 border-black overflow-hidden group"
                        >
                          {/* OCR 업로드 미리보기 — base64/blob URL이라 next/image 미적용. follow-up. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {isOcrProcessing ? (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <RefreshCw
                          size={16}
                          className="animate-spin text-fresh-green"
                        />
                        <span className="text-sm font-bold text-fresh-green">
                          AI 분석 중...
                        </span>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-gray-500 mt-3">
                        클릭 또는 드래그하여 더 추가
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="font-bold mb-2">이미지를 드래그하거나</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ocrImageInputRef.current?.click();
                      }}
                      className="px-4 py-2 bg-fresh-green font-bold border-2 border-black shadow-sm hover:shadow-md transition-all"
                    >
                      파일 선택
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      영수증, 원천징수영수증 등
                    </p>
                  </>
                )}
              </div>

              <input
                ref={ocrImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleOcrImageUpload}
                className="hidden"
              />

              {/* 미리보기 테이블 */}
              {ocrPreviewItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold">입력된 항목 미리보기</span>
                    <span className="text-sm text-gray-500">
                      총 {ocrPreviewItems.length}건
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border-2 border-black">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-left border-b-2 border-black">
                            분류
                          </th>
                          <th className="p-2 text-left border-b-2 border-black">
                            가맹점
                          </th>
                          <th className="p-2 text-right border-b-2 border-black">
                            금액
                          </th>
                          <th className="p-2 text-center border-b-2 border-black">
                            삭제
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrPreviewItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className={clsx(
                              item.category === "대중교통" && "bg-blue-50",
                              item.category === "보험료" && "bg-purple-50",
                              item.category === "의료비" && "bg-green-50",
                              item.category === "전통시장" && "bg-orange-50",
                              item.category === "문화체육" && "bg-pink-50",
                            )}
                          >
                            <td className="p-2 border-b">
                              <span
                                className={clsx(
                                  "text-xs px-2 py-1 rounded",
                                  item.category === "신용카드" &&
                                    "bg-green-100 text-green-600",
                                  item.category === "체크카드" &&
                                    "bg-cyan-100 text-cyan-600",
                                  item.category === "현금영수증" &&
                                    "bg-yellow-100 text-yellow-600",
                                  item.category === "대중교통" &&
                                    "bg-blue-100 text-blue-600",
                                  item.category === "보험료" &&
                                    "bg-purple-100 text-purple-600",
                                  item.category === "의료비" &&
                                    "bg-teal-100 text-teal-600",
                                  item.category === "전통시장" &&
                                    "bg-orange-100 text-orange-600",
                                  item.category === "문화체육" &&
                                    "bg-pink-100 text-pink-600",
                                )}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td className="p-2 border-b">{item.merchant}</td>
                            <td className="p-2 border-b text-right">
                              {item.amount.toLocaleString()}원
                            </td>
                            <td className="p-2 border-b text-center">
                              <button
                                onClick={() => handleRemoveOcrItem(idx)}
                                className="text-red-500 hover:bg-red-100 p-1 rounded"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 카테고리별 합계 */}
                  <div className="mt-3 p-3 bg-highlight-orange/30 border-2 border-black space-y-1">
                    {Object.entries(
                      ocrPreviewItems.reduce(
                        (acc, item) => {
                          acc[item.category] =
                            (acc[item.category] || 0) + item.amount;
                          return acc;
                        },
                        {} as { [key: string]: number },
                      ),
                    ).map(([category, amount]) => (
                      <div
                        key={category}
                        className="flex justify-between text-sm font-bold"
                      >
                        <span>{category}:</span>
                        <span>{amount.toLocaleString()}원</span>
                      </div>
                    ))}
                    <div className="border-t border-black pt-1 mt-2 flex justify-between font-bold">
                      <span>총합계:</span>
                      <span>
                        {ocrPreviewItems
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                  </div>

                  {/* 중복 항목 표시 */}
                  {ocrDuplicateItems.length > 0 && (
                    <div className="mt-3 p-3 bg-ink-black/10 border-2 border-ink-black text-sm">
                      <p className="font-bold text-ink-black mb-2">
                        ⚠️ 중복 이미지 감지됨
                      </p>
                      {[
                        ...new Map(
                          ocrDuplicateItems.map((item) => [
                            `${item.merchant}-${item.amount}`,
                            item,
                          ]),
                        ).values(),
                      ].map((item, idx) => {
                        const count = ocrDuplicateItems.filter(
                          (d) =>
                            d.merchant === item.merchant &&
                            d.amount === item.amount,
                        ).length;
                        return (
                          <p key={idx} className="text-gray-700">
                            <span className="font-bold">{item.merchant}</span> (
                            {item.amount.toLocaleString()}원) - {count}건 중복,
                            1건만 적용
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 자동 분류 안내 */}
              <div className="mb-6 p-3 bg-gray-100 border-2 border-black text-sm">
                <p className="font-bold mb-2">📋 자동 분류 안내:</p>
                <p className="text-blue-600">
                  🚌 대중교통: 버스, 지하철, 모바일이즘 → 대중교통 항목으로 분류
                </p>
                <p className="text-purple-600">
                  🛡 보험료: 메리츠화재, DB손해보험 등 → 보험료 항목으로 분류
                </p>
                <p className="text-green-600">
                  🏥 의료비: 병원, 의원, 약국 등 → 의료비 항목으로 분류
                </p>
                <p className="text-orange-600">
                  🏪 전통시장: 전통시장, 재래시장 등 → 전통시장 항목으로 분류
                </p>
                <p className="text-pink-600">
                  🎭 문화체육: 서점, 도서, 영화관, 헬스 등 → 문화체육 항목으로
                  분류
                </p>
                <p className="text-red-500">
                  ❌ 제외: 세금, 공과금, 통신비, 도로통행료, 사업자번호 없는
                  항목 → 공제 불가
                </p>
                <p className="text-gray-500 mt-1">
                  취소된 거래는 자동으로 제외됩니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() =>
                    handleButtonClick("ocrCancel", handleOcrModalClose)
                  }
                  className={clsx(
                    "px-4 py-2 font-bold border-2 border-black shadow-sm transition-all",
                    clickedBtn === "ocrCancel"
                      ? "bg-ink-black translate-x-[3px] translate-y-[3px] shadow-none"
                      : "bg-white hover:shadow-md",
                  )}
                >
                  취소
                </button>
                <button
                  onClick={handleUseImage}
                  disabled={ocrPreviewItems.length === 0}
                  className={clsx(
                    "px-4 py-2 font-bold border-2 border-black shadow-sm transition-all",
                    ocrPreviewItems.length > 0
                      ? "bg-fresh-green hover:shadow-md"
                      : "bg-gray-200 cursor-not-allowed opacity-50",
                  )}
                >
                  적용하기{" "}
                  {ocrPreviewItems.length > 0 &&
                    `(${ocrPreviewItems.length}건)`}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Excel Upload Modal */}
      {showExcelModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-4 max-w-2xl w-full mx-4 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <FileText size={20} /> 엑셀 업로드
                  </h3>
                  <p className="text-sm text-gray-500">급여 데이터 적용</p>
                </div>
                <button
                  onClick={() =>
                    handleButtonClick("excelModalClose", handleExcelModalClose)
                  }
                  className={clsx(
                    "p-2 border-2 border-black shadow-sm transition-all",
                    clickedBtn === "excelModalClose"
                      ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 월 선택 */}
              <div className="mb-4">
                <label className="block font-bold mb-2">적용할 월 선택</label>
                <select
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={excelModalMonth}
                  onChange={(e) => setExcelModalMonth(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              {/* 드래그앤드롭 영역 */}
              <div
                className={clsx(
                  "min-h-[180px] mb-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all",
                  isExcelDragging
                    ? "border-fresh-green bg-highlight-green/30 scale-[1.02]"
                    : "border-gray-400 bg-gray-50 hover:bg-gray-100",
                )}
                onDrop={handleExcelDrop}
                onDragOver={handleExcelDragOver}
                onDragLeave={handleExcelDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {excelFile ? (
                  <div className="text-center p-4">
                    <p className="text-3xl mb-2">📊</p>
                    <p className="text-lg font-bold mb-1">{excelFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(excelFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    <p className="text-3xl mb-2">📁</p>
                    <p className="text-lg font-bold mb-1">
                      엑셀 파일을 드래그하거나 클릭하세요
                    </p>
                    <p className="text-sm">.xlsx, .xls 파일 지원</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                {excelFile ? (
                  <>
                    <button
                      onClick={() => {
                        setExcelFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="flex-1 py-3 font-bold border-2 border-black bg-white hover:bg-gray-100"
                    >
                      다시 선택
                    </button>
                    <button
                      onClick={handleExcelApply}
                      className="flex-1 py-3 font-bold border-2 border-black bg-fresh-green hover:bg-cyan-300"
                    >
                      적용하기
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      handleButtonClick("excelFileSelect", () =>
                        fileInputRef.current?.click(),
                      )
                    }
                    className={clsx(
                      "w-full py-3 font-bold border-2 border-black shadow-md transition-all",
                      clickedBtn === "excelFileSelect"
                        ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                        : "bg-fresh-green hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                    )}
                  >
                    📁 파일 선택
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase">
          기초자료 등록
        </h2>
        <div className="flex gap-2 flex-wrap">
          {[2024, 2025, 2026].map((year) => (
            <button
              key={year}
              onClick={() =>
                handleButtonClick(`year-${year}`, () => handleYearChange(year))
              }
              className={clsx(
                "px-3 md:px-4 py-2 font-bold border-2 border-black text-sm shadow-md transition-all",
                selectedYear === year
                  ? "bg-black text-white translate-x-[4px] translate-y-[4px] shadow-none"
                  : clickedBtn === `year-${year}`
                    ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                    : "bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Data Grid */}
      <div className="space-y-8">
        {/* Salary Section */}
        <div className="bg-white border border-border-light p-4 md:p-6 shadow-md md:shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-fresh-green p-2 border-2 border-black">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black">급여 데이터</h3>
                <p className="text-xs md:text-sm font-bold text-gray-500">
                  매월 급여명세서 기준 입력
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  handleButtonClick("copy1to3", () => {
                    const currentData = monthlySalary[selectedMonth];
                    if (currentData) {
                      const newMonthlySalary = { ...monthlySalary };
                      for (let m = 1; m <= 3; m++) {
                        newMonthlySalary[m] = { ...currentData };
                      }
                      setMonthlySalary(newMonthlySalary);
                      showNotification(
                        "success",
                        `${selectedMonth}월 데이터를 1~3월에 복사했습니다.`,
                      );
                    }
                  })
                }
                className={clsx(
                  "px-3 py-2 text-xs font-bold border-2 border-black shadow-sm transition-all",
                  clickedBtn === "copy1to3"
                    ? "bg-ink-black translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-highlight-orange/30 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md",
                )}
              >
                1~3월 동일 적용
              </button>
              <button
                onClick={() =>
                  handleButtonClick("copy3to12", () => {
                    const currentData = monthlySalary[selectedMonth];
                    if (currentData) {
                      const newMonthlySalary = { ...monthlySalary };
                      for (let m = 4; m <= 12; m++) {
                        newMonthlySalary[m] = { ...currentData };
                      }
                      setMonthlySalary(newMonthlySalary);
                      showNotification(
                        "success",
                        `${selectedMonth}월 데이터를 4~12월에 복사했습니다.`,
                      );
                    }
                  })
                }
                className={clsx(
                  "px-3 py-2 text-xs font-bold border-2 border-black shadow-sm transition-all",
                  clickedBtn === "copy3to12"
                    ? "bg-ink-black translate-x-[3px] translate-y-[3px] shadow-none"
                    : "bg-highlight-orange/30 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md",
                )}
              >
                4~12월 동일 적용
              </button>
            </div>
          </div>
          {/* Month Tabs */}
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1 mb-4 border-b-2 border-black pb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <button
                key={month}
                onClick={() =>
                  handleButtonClick(`month-${month}`, () =>
                    setSelectedMonth(month),
                  )
                }
                className={clsx(
                  "py-2 font-bold text-sm border-2 border-black transition-all",
                  selectedMonth === month
                    ? "bg-black text-white shadow-none"
                    : clickedBtn === `month-${month}`
                      ? "bg-fresh-green translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md",
                )}
              >
                {month}월
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">월급여 (세전)</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.totalSalary || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("totalSalary", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">비과세 식대</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.mealAllowance || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("mealAllowance", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">국민연금</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.nationalPension || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("nationalPension", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">건강보험</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.healthInsurance || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("healthInsurance", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">노인장기요양보험</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.longTermCare || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("longTermCare", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">고용보험</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.employmentInsurance || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("employmentInsurance", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">상여금</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.bonus || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("bonus", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">자녀학자금</label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.childTuition || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("childTuition", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">
                기납부세액 (소득세)
              </label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.prepaidTax || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("prepaidTax", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block font-bold mb-2">
                기납부세액 (지방소득세)
              </label>
              <input
                type="text"
                className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                value={monthlySalary[selectedMonth]?.localIncomeTax || "0"}
                onChange={(e) =>
                  handleSalaryInputChange("localIncomeTax", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Family Info Section */}
        <div className="bg-white border border-border-light p-4 md:p-6 shadow-md md:shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-highlight-orange/30 p-2 border-2 border-black">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black">가족 정보</h3>
              <p className="text-xs md:text-sm font-bold text-gray-500">
                인적공제 및 카드공제 한도 확대 적용
              </p>
            </div>
          </div>

          {/* 기본공제 섹션 */}
          <div className="mb-6">
            <h4 className="text-base font-black mb-3 px-2 py-1 bg-fresh-green border-2 border-black inline-block">
              기본공제
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">배우자공제</label>
                <div className="flex gap-2">
                  {[false, true].map((hasSpouse) => (
                    <button
                      key={hasSpouse ? "yes" : "no"}
                      onClick={() =>
                        setFamilyData((prev) => ({
                          ...prev,
                          spouse: hasSpouse,
                        }))
                      }
                      className={clsx(
                        "flex-1 p-3 border border-border-light font-bold text-lg transition-colors",
                        familyData.spouse === hasSpouse
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-100",
                      )}
                    >
                      {hasSpouse ? "있음" : "없음"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-2">
                  만 20세 이하 자녀 수
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.children}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      children: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>

              <div>
                <label className="block font-bold mb-2">
                  직계존속 (만 60세 이상)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.parents}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      parents: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-2">형제자매</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.siblings}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      siblings: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-2">
                  위탁아동 (6개월 이상)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.foster}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      foster: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-2">기초생활수급자</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.recipient}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      recipient: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* 세액공제 섹션 */}
          <div className="mb-6">
            <h4 className="text-base font-black mb-3 px-2 py-1 bg-highlight-orange/30 border-2 border-black inline-block">
              세액공제
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">
                  만 8세 이상 자녀 수
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.childrenOver8}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      childrenOver8: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-bold mb-2">출생·입양자</label>
                <select
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.birthAdoption}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      birthAdoption: e.target.value as
                        | "none"
                        | "first"
                        | "second"
                        | "third1"
                        | "third2"
                        | "third3",
                    }))
                  }
                >
                  <option value="none">선택 안함</option>
                  <option value="first">첫째</option>
                  <option value="second">둘째</option>
                  <option value="third1">셋째 이상 (1명)</option>
                  <option value="third2">셋째 이상 (2명)</option>
                  <option value="third3">셋째 이상 (3명)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 비과세 섹션 */}
          <div>
            <h4 className="text-base font-black mb-3 px-2 py-1 bg-highlight-orange/30 border-2 border-black inline-block">
              비과세
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">
                  만 6세 이하 자녀 수 (보육수당)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors"
                  value={familyData.childrenUnder6}
                  onChange={(e) =>
                    setFamilyData((prev) => ({
                      ...prev,
                      childrenUnder6: Math.max(
                        0,
                        parseInt(e.target.value) || 0,
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spending Section */}
        <div className="bg-white border border-border-light p-4 md:p-6 shadow-md md:shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-ink-black p-2 border-2 border-black">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black">
                  지출 데이터 ({selectedSpendingMonth}월)
                </h3>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={() =>
                  handleButtonClick("cardExcel", handleCardExcelModalOpen)
                }
                className={clsx(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border-2 border-black font-bold text-xs md:text-sm shadow-md transition-all",
                  clickedBtn === "excel"
                    ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                    : "bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                )}
              >
                <FileText
                  size={14}
                  className={clsx(
                    "md:w-4 md:h-4",
                    clickedBtn === "excel" && "animate-spin",
                  )}
                />{" "}
                엑셀
              </button>
              <button
                onClick={() => handleButtonClick("ocr", handleOcrModalOpen)}
                className={clsx(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border-2 border-black font-bold text-xs md:text-sm shadow-md transition-all",
                  clickedBtn === "ocr"
                    ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
                    : "bg-highlight-orange/30 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                )}
              >
                <Upload size={14} className="md:w-4 md:h-4" /> OCR
              </button>
              <button
                onClick={() =>
                  handleButtonClick("sync", () =>
                    showNotification(
                      "success",
                      "카드사 연동 기능 준비중입니다!",
                    ),
                  )
                }
                className={clsx(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border-2 border-black font-bold text-xs md:text-sm shadow-md transition-all",
                  clickedBtn === "sync"
                    ? "bg-fresh-green translate-x-[4px] translate-y-[4px] shadow-none"
                    : "bg-black text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                )}
              >
                <RefreshCw
                  size={14}
                  className={clsx(
                    "md:w-4 md:h-4",
                    clickedBtn === "sync" && "animate-spin",
                  )}
                />{" "}
                동기화
              </button>
            </div>
          </div>

          {/* Month Tabs for Spending */}
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1 mb-4 border-b-2 border-black pb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <button
                key={month}
                onClick={() =>
                  handleButtonClick(`spending-month-${month}`, () =>
                    setSelectedSpendingMonth(month),
                  )
                }
                className={clsx(
                  "py-2 font-bold text-sm border-2 border-black transition-all",
                  selectedSpendingMonth === month
                    ? "bg-black text-white shadow-none"
                    : clickedBtn === `spending-month-${month}`
                      ? "bg-fresh-green translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md",
                )}
              >
                {month}월
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {spendingItems.filter(
              (item) => item.month === selectedSpendingMonth,
            ).length > 0 ? (
              spendingItems
                .filter((item) => item.month === selectedSpendingMonth)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b-2 border-gray-100 pb-2 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.name}</span>
                      {item.details && item.details.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedItemDetails(item);
                            setShowDetailsModal(true);
                          }}
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-200 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          {item.details.length}건
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg tracking-tight">
                        {parseInt(
                          item.amount.replace(/[^0-9]/g, "") || "0",
                        ).toLocaleString("ko-KR")}
                        원
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="font-bold">
                  {selectedSpendingMonth}월 지출 데이터가 없습니다
                </p>
                <p className="text-sm mt-1">
                  엑셀 업로드 또는 수동 항목 추가로 데이터를 입력하세요
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setNewItemMonth(selectedSpendingMonth);
              handleButtonClick("addItem", () => setShowAddItemModal(true));
            }}
            className={clsx(
              "w-full mt-6 py-3 border-2 border-dashed font-bold transition-all flex items-center justify-center gap-2",
              clickedBtn === "addItem"
                ? "border-black bg-highlight-orange/30 text-black"
                : "border-gray-300 text-gray-400 hover:border-black hover:text-black hover:bg-gray-50",
            )}
          >
            <Plus size={16} /> 수동 항목 추가
          </button>
        </div>
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-black flex justify-center gap-4 z-40 md:static md:bg-transparent md:border-none md:p-0 md:mt-8">
        <button
          onClick={() => handleButtonClick("cancel")}
          className={clsx(
            "px-6 py-3 font-bold border-2 border-black shadow-md transition-all",
            clickedBtn === "cancel"
              ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
              : "bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
          )}
        >
          변경취소
        </button>
        <button
          onClick={() => handleButtonClick("save", handleSave)}
          className={clsx(
            "px-6 py-3 font-bold border-2 border-black shadow-md transition-all",
            clickedBtn === "save"
              ? "bg-ink-black translate-x-[4px] translate-y-[4px] shadow-none"
              : "bg-fresh-green hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
          )}
        >
          저장하기
        </button>
      </div>

      {/* 카드사 엑셀 업로드 모달 */}
      {showCardExcelModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
                <h3 className="text-xl font-black">엑셀 업로드</h3>
                <button
                  onClick={() =>
                    handleButtonClick(
                      "cardExcelClose",
                      handleCardExcelModalClose,
                    )
                  }
                  className={clsx(
                    "p-2 border-2 border-black shadow-sm transition-all",
                    clickedBtn === "cardExcelClose"
                      ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 카드 타입 탭 */}
              <p className="font-bold text-base mb-2">📋 사용 내역 선택</p>
              <div className="flex gap-2 mb-4">
                {[
                  {
                    type: "credit" as const,
                    label: "💳 신용카드",
                    btnId: "cardExcelTabCredit",
                  },
                  {
                    type: "debit" as const,
                    label: "💳 직불카드",
                    btnId: "cardExcelTabDebit",
                  },
                  {
                    type: "cash" as const,
                    label: "🧾 현금영수증",
                    btnId: "cardExcelTabCash",
                  },
                ].map(({ type, label, btnId }) => {
                  const isDisabled =
                    cardExcelFile !== null && cardType !== type;
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        !isDisabled &&
                        handleButtonClick(btnId, () => setCardType(type))
                      }
                      disabled={isDisabled}
                      className={clsx(
                        "flex-1 py-3 font-bold border-2 border-black transition-all",
                        cardType === type
                          ? "bg-fresh-green shadow-none translate-x-[2px] translate-y-[2px]"
                          : isDisabled
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                            : clickedBtn === btnId
                              ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                              : "bg-white shadow-md hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-md",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* 파일 업로드 영역 */}
              <div
                onDrop={handleCardExcelDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsCardExcelDragging(true);
                }}
                onDragLeave={() => setIsCardExcelDragging(false)}
                className={clsx(
                  "border-2 border-dashed p-8 text-center mb-6 transition-all",
                  isCardExcelDragging
                    ? "border-fresh-green bg-highlight-green/20"
                    : "border-gray-300",
                  cardExcelFile && "border-fresh-green bg-highlight-green/20",
                )}
              >
                <input
                  ref={cardExcelInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleCardExcelUpload}
                  className="hidden"
                />
                {cardExcelFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle size={24} className="text-green-500" />
                    <span className="font-bold">{cardExcelFile.name}</span>
                    <button
                      onClick={() => {
                        setCardExcelFile(null);
                        setCardExcelPreview([]);
                        if (cardExcelInputRef.current)
                          cardExcelInputRef.current.value = "";
                      }}
                      className="p-1 hover:bg-red-100 text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="font-bold mb-2">엑셀 파일을 드래그하거나</p>
                    <button
                      onClick={() => cardExcelInputRef.current?.click()}
                      className="px-4 py-2 bg-fresh-green font-bold border-2 border-black shadow-sm hover:shadow-md transition-all"
                    >
                      파일 선택
                    </button>
                  </>
                )}
              </div>

              {/* 미리보기 */}
              {cardExcelPreview.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold">파싱 결과 미리보기</span>
                    <span className="text-sm text-gray-500">
                      총 {cardExcelPreview.length}건
                      {excludedCount > 0 && (
                        <span className="text-red-500 ml-2">
                          (제외: {excludedCount}건)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border-2 border-black">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-left border-b-2 border-black">
                            날짜
                          </th>
                          <th className="p-2 text-left border-b-2 border-black">
                            가맹점
                          </th>
                          <th className="p-2 text-right border-b-2 border-black">
                            금액
                          </th>
                          <th className="p-2 text-center border-b-2 border-black">
                            분류
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cardExcelPreview.map((item, idx) => (
                          <tr
                            key={idx}
                            className={clsx(
                              item.category === "excluded" &&
                                "bg-red-50 text-red-400 line-through",
                              item.category === "transport" && "bg-blue-50",
                              item.category === "insurance" && "bg-purple-50",
                              item.category === "medical" && "bg-green-50",
                              item.category === "market" && "bg-orange-50",
                              item.category === "culture" && "bg-pink-50",
                            )}
                          >
                            <td className="p-2 border-b">{item.date}</td>
                            <td className="p-2 border-b">{item.merchant}</td>
                            <td className="p-2 border-b text-right">
                              {item.amount.toLocaleString()}원
                            </td>
                            <td className="p-2 border-b text-center">
                              {item.category === "excluded" ? (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  제외
                                </span>
                              ) : item.category === "transport" ? (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  대중교통
                                </span>
                              ) : item.category === "insurance" ? (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                  보험료
                                </span>
                              ) : item.category === "medical" ? (
                                <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded">
                                  의료비
                                </span>
                              ) : item.category === "market" ? (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                  전통시장
                                </span>
                              ) : item.category === "culture" ? (
                                <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">
                                  문화체육
                                </span>
                              ) : (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                  {cardType === "credit"
                                    ? "신용"
                                    : cardType === "debit"
                                      ? "직불"
                                      : "현금"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 p-3 bg-highlight-orange/30 border-2 border-black space-y-1">
                    <div className="flex justify-between font-bold text-sm">
                      <span>
                        {cardType === "credit"
                          ? "💳 신용카드"
                          : cardType === "debit"
                            ? "💳 직불카드"
                            : "🧾 현금영수증"}
                        :
                      </span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "card")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>🚌 대중교통:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "transport")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>🛡️ 보험료:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "insurance")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-teal-600">
                      <span>🏥 의료비:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "medical")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>🏪 전통시장:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "market")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-pink-600">
                      <span>🎭 문화체육:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "culture")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>❌ 제외:</span>
                      <span>
                        {cardExcelPreview
                          .filter((i) => i.category === "excluded")
                          .reduce((s, i) => s + i.amount, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 안내 문구 */}
              <div className="mb-6 p-3 bg-gray-100 border-2 border-black text-sm">
                <p className="font-bold mb-2">📋 자동 분류 안내:</p>
                <p className="text-blue-600">
                  🚌 대중교통: 버스, 지하철, 모바일이즐 → 대중교통 항목으로 분류
                </p>
                <p className="text-purple-600">
                  🛡️ 보험료: 메리츠화재, DB손해보험 등 → 보험료 항목으로 분류
                </p>
                <p className="text-teal-600">
                  🏥 의료비: 병원, 의원, 약국 등 → 의료비 항목으로 분류
                </p>
                <p className="text-orange-600">
                  🏪 전통시장: 전통시장, 재래시장 등 → 전통시장 항목으로 분류
                </p>
                <p className="text-pink-600">
                  🎭 문화체육: 서점, 도서, 영화관, 헬스 등 → 문화체육 항목으로
                  분류
                </p>
                <p className="text-red-500">
                  ❌ 제외: 세금, 공과금, 통신비, 도로통행료, 사업자번호 없는
                  항목 → 공제 불가
                </p>
                <p className="text-gray-500 mt-1">
                  취소된 거래는 자동으로 제외됩니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCardExcelModalClose}
                  className="px-4 py-2 font-bold border-2 border-black bg-white shadow-sm hover:shadow-md transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleCardExcelApply}
                  disabled={!cardExcelFile || cardExcelPreview.length === 0}
                  className={clsx(
                    "px-4 py-2 font-bold border-2 border-black shadow-sm transition-all",
                    cardExcelFile && cardExcelPreview.length > 0
                      ? "bg-fresh-green hover:shadow-md"
                      : "bg-gray-200 cursor-not-allowed opacity-50",
                  )}
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 세부 내역 모달 */}
      {showDetailsModal &&
        selectedItemDetails &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
                <h3 className="text-xl font-black">
                  {selectedItemDetails.name} 상세 내역
                </h3>
                <button
                  onClick={() =>
                    handleButtonClick("detailsClose", () => {
                      setShowDetailsModal(false);
                      setSelectedItemDetails(null);
                    })
                  }
                  className={clsx(
                    "p-2 border-2 border-black shadow-sm transition-all",
                    clickedBtn === "detailsClose"
                      ? "bg-ink-black translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-highlight-orange/30 border-2 border-black">
                <div className="flex justify-between font-bold">
                  <span>총 {selectedItemDetails.details?.length || 0}건</span>
                  <span className="text-lg">
                    {selectedItemDetails.amount}원
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border-2 border-black">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left border-b-2 border-black">
                        날짜
                      </th>
                      <th className="p-2 text-left border-b-2 border-black">
                        가맹점
                      </th>
                      <th className="p-2 text-right border-b-2 border-black">
                        금액
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItemDetails.details?.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border-b">{detail.date}</td>
                        <td className="p-2 border-b">{detail.merchant}</td>
                        <td className="p-2 border-b text-right">
                          {detail.amount.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedItemDetails(null);
                  }}
                  className="px-4 py-2 font-bold border-2 border-black bg-white shadow-sm hover:shadow-md transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 전통시장 불확실 매칭 확인 모달 */}
      {showMarketConfirmModal &&
        uncertainMarketItems.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white border border-border-light p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
                <h3 className="text-xl font-black">🏪 전통시장 확인</h3>
                <button
                  onClick={() => {
                    setShowMarketConfirmModal(false);
                    setUncertainMarketItems([]);
                  }}
                  className="p-2 border-2 border-black bg-white shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                아래 가맹점이 전통시장 DB에서 유사한 이름으로 검색되었습니다.
                <br />
                전통시장으로 분류할 항목을 선택해주세요.
              </p>

              <div className="space-y-3">
                {uncertainMarketItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="border-2 border-black p-3 bg-yellow-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-base">
                          {item.merchantName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          🔍 유사 매칭:{" "}
                          <span className="font-bold text-black">
                            {item.matchedMarketName}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          📍 {item.belongsTo} ({item.address}) · 매칭률{" "}
                          {(item.matchRatio * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          // 전통시장으로 분류
                          setCardExcelPreview((prev) => {
                            const updated = [...prev];
                            const target = updated.find(
                              (p) => p.merchant === item.merchantName,
                            );
                            if (target && target.category === "card") {
                              target.category = "market";
                            }
                            return updated;
                          });
                          // 목록에서 제거
                          setUncertainMarketItems((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                          showNotification(
                            "success",
                            `🏪 ${item.merchantName} → 전통시장으로 분류`,
                          );
                        }}
                        className="flex-1 py-2 px-3 font-bold text-sm border-2 border-black bg-fresh-green shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md transition-all"
                      >
                        ✅ 전통시장 맞음
                      </button>
                      <button
                        onClick={() => {
                          // 목록에서 제거 (card로 유지)
                          setUncertainMarketItems((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                          console.log(
                            `❌ 사용자 거부: ${item.merchantName} → 전통시장 아님`,
                          );
                        }}
                        className="flex-1 py-2 px-3 font-bold text-sm border-2 border-black bg-gray-200 shadow-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-md transition-all"
                      >
                        ❌ 아님
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {uncertainMarketItems.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle
                    size={48}
                    className="mx-auto mb-2 text-green-500"
                  />
                  <p className="font-bold">모든 항목 처리 완료!</p>
                </div>
              )}

              <div className="flex justify-end mt-4 pt-4 border-t-2 border-black">
                <button
                  onClick={() => {
                    setShowMarketConfirmModal(false);
                    setUncertainMarketItems([]);
                  }}
                  className="px-6 py-2 font-bold border-2 border-black bg-white shadow-sm hover:shadow-md transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
