import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiGuard } from "@/lib/api-guard";
import { createLimiter } from "@/lib/rate-limit";

const HOSPITAL_API_KEY = process.env.PHARMACY_API_KEY; // 동일 키 사용
const BASE_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";

const hospitalSinglesSchema = z.object({ name: z.string().min(1).max(200) });
const hospitalBatchSchema = z.object({ names: z.array(z.string().min(1).max(200)).min(1).max(500) });

type HospitalSingleRequest = z.infer<typeof hospitalSinglesSchema>;
type HospitalBatchRequest = z.infer<typeof hospitalBatchSchema>;

const limiter = createLimiter("hospital", 30);

interface HospitalItem {
    yadmNm: string;      // 병원명
    addr: string;        // 주소
    telno: string;       // 전화번호
    clCd: string;        // 종별코드
    clCdNm: string;      // 종별코드명 (종합병원, 병원, 의원 등)
    sidoCd: string;      // 시도코드
    sgguCd: string;      // 시군구코드
}

interface HospitalResponse {
    response: {
        header: {
            resultCode: string;
            resultMsg: string;
        };
        body: {
            items: {
                item: HospitalItem | HospitalItem[];
            };
            numOfRows: number;
            pageNo: number;
            totalCount: number;
        };
    };
}

/**
 * 병원명으로 병원 정보 검색 (단건)
 * POST /api/hospital
 */
export const POST = withApiGuard<HospitalSingleRequest>(async (_req, ctx) => {
    try {
        if (!HOSPITAL_API_KEY) {
            return NextResponse.json(
                { error: "HOSPITAL_API_KEY not configured" },
                { status: 500 }
            );
        }

        const result = await checkHospitalByApi(ctx.body.name);
        return NextResponse.json(result);

    } catch (error) {
        console.error("[Hospital API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", isHospital: false },
            { status: 500 }
        );
    }
}, { limiter, schema: hospitalSinglesSchema });

/**
 * 여러 가맹점명 일괄 체크 (실제 API 호출)
 * PUT /api/hospital
 * Body: { names: string[] }
 */
export const PUT = withApiGuard<HospitalBatchRequest>(async (_req, ctx) => {
    try {
        const { names } = ctx.body;

        if (!HOSPITAL_API_KEY) {
            console.warn("[Hospital API Batch] API key not configured, falling back to keyword matching");
            // API 키가 없으면 키워드 기반 fallback
            const fallbackKeywords = ["병원", "의원", "클리닉", "치과", "한의원", "안과", "피부과", "정형외과", "내과", "외과", "소아과", "산부인과", "이비인후과", "비뇨기과", "메디컬", "의료법인", "의료재단", "의료원"];
            const results = names.map(name => ({
                name,
                isHospital: fallbackKeywords.some(kw => name.toLowerCase().includes(kw.toLowerCase())),
                reason: "keyword_fallback"
            }));
            const hospitalCount = results.filter(r => r.isHospital).length;
            return NextResponse.json({
                results,
                summary: { total: names.length, hospitalCount, nonHospitalCount: names.length - hospitalCount }
            });
        }

        // 실제 API 호출로 각 가맹점 검증
        // API 과부하 방지를 위해 5개씩 병렬 처리
        const BATCH_SIZE = 5;
        const allResults: { name: string; isHospital: boolean; reason: string; hospitalName?: string; type?: string }[] = [];

        for (let i = 0; i < names.length; i += BATCH_SIZE) {
            const batch = names.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(name => checkHospitalByApi(name))
            );
            allResults.push(...batchResults);
        }

        const hospitalCount = allResults.filter(r => r.isHospital).length;

        console.log(`[Hospital API Batch] 검증 완료: ${hospitalCount}/${names.length}개 병원 확인`);

        return NextResponse.json({
            results: allResults,
            summary: {
                total: names.length,
                hospitalCount,
                nonHospitalCount: names.length - hospitalCount
            }
        });

    } catch (error) {
        console.error("[Hospital API Batch] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}, { limiter, schema: hospitalBatchSchema });

/**
 * 개별 가맹점명을 실제 건강보험심사평가원 API로 검증
 */
async function checkHospitalByApi(name: string): Promise<{ name: string; isHospital: boolean; reason: string; hospitalName?: string; type?: string }> {
    try {
        // 가맹점명에서 검색 키워드 추출 (공백/특수문자 기준 첫 단어 또는 핵심 부분)
        // 예: "의료법인인성의료재단" → "의료법인인성의료재단"
        // 예: "한가람 메디즈 의원" → "한가람"
        const searchName = extractSearchName(name);

        if (!searchName || searchName.length < 2) {
            return { name, isHospital: false, reason: "name_too_short" };
        }

        const encodedKey = encodeURIComponent(HOSPITAL_API_KEY!);
        const encodedName = encodeURIComponent(searchName);

        const url = `${BASE_URL}?serviceKey=${encodedKey}&pageNo=1&numOfRows=10&yadmNm=${encodedName}&_type=json`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
            console.error(`[Hospital API] HTTP Error for "${name}":`, response.status);
            return { name, isHospital: false, reason: "api_http_error" };
        }

        const data: HospitalResponse = await response.json();

        if (data.response?.header?.resultCode !== "00") {
            console.error(`[Hospital API] API Error for "${name}":`, data.response?.header?.resultMsg);
            return { name, isHospital: false, reason: "api_error" };
        }

        const totalCount = data.response?.body?.totalCount || 0;

        if (totalCount === 0) {
            return { name, isHospital: false, reason: "api_no_result" };
        }

        const items = data.response?.body?.items?.item;
        const hospitalList = Array.isArray(items) ? items : [items];

        // 검색 결과가 실제로 입력 가맹점명과 일치하는지 확인
        // (API가 부분 매칭을 반환하므로, 실제 이름 유사도 검증 필요)
        const normalizedInput = name.replace(/[\s_]/g, "").toLowerCase();
        const normalizedSearch = searchName.toLowerCase();

        const matchedHospital = hospitalList.find(h => {
            if (!h?.yadmNm) return false;
            const normalizedApi = h.yadmNm.replace(/\s+/g, "").toLowerCase();

            if (normalizedApi.length < 3) return false;

            // 정확히 동일하면 바로 매칭
            if (normalizedInput === normalizedApi) return true;

            // 전체 이름 기준 포함 관계만 확인 (검색어 기준 X)
            const inputContainsApi = normalizedInput.includes(normalizedApi);
            const apiContainsInput = normalizedApi.includes(normalizedInput);

            if (!inputContainsApi && !apiContainsInput) return false;

            // 입력 가맹점명에 의료 키워드가 있어야만 부분 매칭 허용
            const hospitalKw = ["병원", "의원", "클리닉", "의료", "한의원", "치과", "안과", "내과", "외과", "피부과", "정형외과", "이비인후과", "소아과", "산부인과", "비뇨기과", "검진", "약국"];
            const inputHasHospitalKw = hospitalKw.some(k => normalizedInput.includes(k));
            if (!inputHasHospitalKw) return false;

            return true;
        });

        if (!matchedHospital) {
            console.log(`[Hospital API] "${name}" → 검색 결과 있으나 이름 불일치 (결과: ${hospitalList.map(h => h?.yadmNm).join(", ")})`);
            return { name, isHospital: false, reason: "api_name_mismatch" };
        }

        return {
            name,
            isHospital: true,
            reason: "api_confirmed",
            hospitalName: matchedHospital.yadmNm,
            type: matchedHospital.clCdNm
        };

    } catch (error) {
        console.error(`[Hospital API] Error checking "${name}":`, error);
        return { name, isHospital: false, reason: "api_exception" };
    }
}

/**
 * 가맹점명에서 API 검색용 이름 추출
 * - 카드사 엑셀의 가맹점명은 다양한 형식: "의료법인인성의료재단", "한가람 의원", "모바일이즐_삼성_삼성페이_후불_버스" 등
 * - 공백/언더스코어로 분리된 경우 첫 단어 사용
 * - 붙어있는 이름은 그대로 사용
 */
function extractSearchName(merchant: string): string {
    // 언더스코어를 공백으로 변환
    let cleaned = merchant.replace(/_/g, " ").trim();

    // 법인 접두/접미사 제거 (주식회사, (주), 유한회사 등)
    cleaned = cleaned.replace(/^(주식회사|유한회사|합자회사|합명회사|사단법인|재단법인|사회적협동조합|협동조합|의료법인)\s*/g, "").trim();
    cleaned = cleaned.replace(/\s*(주식회사|유한회사|합자회사|합명회사)$/g, "").trim();
    cleaned = cleaned.replace(/^\(주\)\s*/g, "").trim();
    cleaned = cleaned.replace(/\s*\(주\)$/g, "").trim();

    const parts = cleaned.split(/\s+/);
    // 첫 단어가 너무 짧으면 (2글자 이하) 두 번째 단어까지 합침
    if (parts.length > 1 && parts[0].length <= 2) {
        return parts.slice(0, 2).join("");
    }
    return parts[0];
}
