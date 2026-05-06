import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiGuard } from "@/lib/api-guard";
import { createLimiter } from "@/lib/rate-limit";

const MARKET_API_KEY = process.env.MARKET_API_KEY;

const marketSinglesSchema = z.object({ name: z.string().min(1).max(200) });
const marketBatchSchema = z.object({ names: z.array(z.string().min(1).max(200)).min(1).max(500) });

type MarketSingleRequest = z.infer<typeof marketSinglesSchema>;
type MarketBatchRequest = z.infer<typeof marketBatchSchema>;

const limiter = createLimiter("market", 30);
// 최신 버전 (20250731) - 소상공인시장진흥공단_전국 온누리상품권 가맹점 현황
const BASE_URL = "https://api.odcloud.kr/api/3060079/v1/uddi:7ffa42f8-01d1-4329-aa94-aefb67c53cf1";

interface MarketMerchantItem {
    가맹점명: string;
    "소속 시장명(또는 상점가)": string;
    소재지: string;
    취급품목?: string;
    등록년도?: number;
}

interface MarketResponse {
    currentCount: number;
    data: MarketMerchantItem[];
    matchCount: number;
    page: number;
    perPage: number;
    totalCount: number;
}

/**
 * 가맹점명으로 전통시장 가맹점 여부 확인 (단건)
 * POST /api/market
 * Body: { name: string }
 */
export const POST = withApiGuard<MarketSingleRequest>(async (_req, ctx) => {
    try {
        if (!MARKET_API_KEY) {
            return NextResponse.json(
                { error: "MARKET_API_KEY not configured" },
                { status: 500 }
            );
        }

        const result = await checkMarketMerchantByApi(ctx.body.name);
        return NextResponse.json(result);

    } catch (error) {
        console.error("[Market API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", isMarket: false },
            { status: 500 }
        );
    }
}, { limiter, schema: marketSinglesSchema });

/**
 * 여러 가맹점명 일괄 체크 (실제 API 호출)
 * PUT /api/market
 * Body: { names: string[] }
 */
export const PUT = withApiGuard<MarketBatchRequest>(async (_req, ctx) => {
    try {
        const { names } = ctx.body;

        if (!MARKET_API_KEY) {
            console.warn("[Market API Batch] API key not configured, falling back to keyword matching");
            const fallbackKeywords = ["시장", "전통시장", "재래시장", "5일장", "오일장"];
            const results = names.map(name => ({
                name,
                isMarket: fallbackKeywords.some(kw => name.toLowerCase().includes(kw.toLowerCase())),
                reason: "keyword_fallback"
            }));
            const marketCount = results.filter(r => r.isMarket).length;
            return NextResponse.json({
                results,
                summary: { total: names.length, marketCount, nonMarketCount: names.length - marketCount }
            });
        }

        // 실제 API 호출로 각 가맹점 검증
        // API 과부하 방지를 위해 3개씩 배치 처리
        const BATCH_SIZE = 3;
        const allResults: { name: string; isMarket: boolean; reason: string; marketName?: string; belongsTo?: string; address?: string }[] = [];

        for (let i = 0; i < names.length; i += BATCH_SIZE) {
            const batch = names.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(name => checkMarketMerchantByApi(name))
            );
            allResults.push(...batchResults);
        }

        const marketCount = allResults.filter(r => r.isMarket).length;

        console.log(`[Market API Batch] 검증 완료: ${marketCount}/${names.length}개 전통시장 가맹점 확인`);

        return NextResponse.json({
            results: allResults,
            summary: {
                total: names.length,
                marketCount,
                nonMarketCount: names.length - marketCount
            }
        });

    } catch (error) {
        console.error("[Market API Batch] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}, { limiter, schema: marketBatchSchema });

/**
 * 개별 가맹점명을 전통시장 가맹점 API로 검증
 * cond[가맹점명::LIKE] 로 15만+ 가맹점 DB에서 검색
 */
async function checkMarketMerchantByApi(name: string): Promise<{
    name: string;
    isMarket: boolean;
    reason: string;
    marketName?: string;
    belongsTo?: string;
    address?: string;
    confidence?: "confirmed" | "uncertain";
    matchRatio?: number;
    candidates?: Array<{ marketName: string; belongsTo: string; address: string }>;
}> {
    try {
        const searchName = extractSearchName(name);

        if (!searchName || searchName.length < 2) {
            return { name, isMarket: false, reason: "name_too_short" };
        }

        // cond[가맹점명::LIKE] 파라미터로 가맹점명 부분 검색
        const encodedName = encodeURIComponent(searchName);
        const condParam = encodeURIComponent("cond[가맹점명::LIKE]");
        const url = `${BASE_URL}?page=1&perPage=10&serviceKey=${MARKET_API_KEY}&${condParam}=%25${encodedName}%25`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
            console.error(`[Market API] HTTP Error for "${name}":`, response.status);
            return { name, isMarket: false, reason: "api_http_error" };
        }

        const data: MarketResponse = await response.json();

        if (!data.data || data.matchCount === 0) {
            return { name, isMarket: false, reason: "api_no_result" };
        }

        // 검색 결과에서 가맹점명이 실제로 일치하는지 확인
        const matchResult = findBestMerchantMatch(name, data.data);

        if (matchResult) {
            const { merchant, confidence, matchRatio } = matchResult;
            return {
                name,
                isMarket: confidence === "confirmed",
                reason: confidence === "confirmed" ? "api_confirmed" : "api_uncertain",
                marketName: merchant.가맹점명,
                belongsTo: merchant["소속 시장명(또는 상점가)"],
                address: merchant.소재지,
                confidence,
                matchRatio,
                // uncertain인 경우  후보 목록도 전달
                ...(confidence === "uncertain" ? {
                    candidates: data.data.slice(0, 5).map(m => ({
                        marketName: m.가맹점명,
                        belongsTo: m["소속 시장명(또는 상점가)"],
                        address: m.소재지
                    }))
                } : {})
            };
        }

        return { name, isMarket: false, reason: "api_no_match" };

    } catch (error) {
        console.error(`[Market API] Error checking "${name}":`, error);
        return { name, isMarket: false, reason: "api_exception" };
    }
}

/**
 * 가맹점명에서 핵심 이름 추출 (검색용)
 */
function extractSearchName(merchant: string): string {
    // 언더스코어를 공백으로
    let cleaned = merchant.replace(/_/g, " ").trim();

    // 괄호 안 지점명 제거: (중앙점), (본점) 등
    cleaned = cleaned.replace(/\((?:중앙점|본점|분점|\d+호점|점)\)$/, "").trim();

    // 괄호 안 영문 브랜드 제거: 씨유(CU), 지에스(GS) 등
    cleaned = cleaned.replace(/\([A-Za-z0-9]+\)/g, "").trim();

    // 지점명 접미사 제거 (중앙점, 본점, 1호점, ~점 등)
    cleaned = cleaned.replace(/\s+\S*점$/, "").trim();

    // 법인 접두/접미사 제거 (주식회사, (주), 유한회사 등)
    cleaned = cleaned.replace(/^(주식회사|유한회사|합자회사|합명회사|사단법인|재단법인|사회적협동조합|협동조합)\s*/g, "").trim();
    cleaned = cleaned.replace(/\s*(주식회사|유한회사|합자회사|합명회사)$/g, "").trim();
    cleaned = cleaned.replace(/^\(주\)\s*/g, "").trim();
    cleaned = cleaned.replace(/\s*\(주\)$/g, "").trim();

    // 숫자만 있는 토큰 제거 (예: "9", "123" 등)
    cleaned = cleaned.replace(/\b\d+\b/g, "").trim();

    // 전통시장과 무관한 플랫폼/서비스 키워드가 포함되면 빈 문자열 반환
    const excludedKeywords = ["카카오", "택시", "배달", "우버", "네이버", "쿠팡", "배민", "요기요"];
    const lowerCleaned = cleaned.toLowerCase();
    if (excludedKeywords.some(kw => lowerCleaned.includes(kw))) {
        return "";
    }

    // 공백 있으면 첫 단어만 사용 (보통 가맹점 이름)
    const parts = cleaned.split(/\s+/).filter(p => p.length > 0);
    if (parts.length > 1) {
        // 첫 단어가 너무 짧으면 (2글자 이하) 두 번째 단어도 합침
        if (parts[0].length <= 2) {
            return parts.slice(0, 2).join("");
        }
        return parts[0];
    }

    return cleaned;
}

interface MatchResult {
    merchant: MarketMerchantItem;
    confidence: "confirmed" | "uncertain";
    matchRatio: number;
}

/**
 * API 검색 결과에서 가맹점명과 가장 유사한 항목 찾기
 * - confirmed: ≥50% 매칭 비율 → 자동 분류
 * - uncertain: <50% 매칭 비율 → 사용자 확인 필요
 */
function findBestMerchantMatch(merchantName: string, merchants: MarketMerchantItem[]): MatchResult | null {
    // 괄호 제거 + 공백 제거한 정규화 이름
    const normalizedInput = merchantName
        .replace(/_/g, "")
        .replace(/\([^)]*\)/g, "")  // 괄호 내용 제거
        .replace(/\s+/g, "")
        .toLowerCase();
    const searchCoreName = extractSearchName(merchantName).replace(/\s+/g, "").toLowerCase();

    // 최소 검색어 길이 체크
    if (searchCoreName.length < 2) {
        return null;
    }

    // 1차: 정확히 일치 (공백/특수문자 무시) → confirmed
    for (const m of merchants) {
        const normalizedApi = m.가맹점명.replace(/\s+/g, "").toLowerCase();
        if (normalizedInput === normalizedApi) {
            return { merchant: m, confidence: "confirmed", matchRatio: 1.0 };
        }
    }

    // 2차: 입력 가맹점명이 API 가맹점명을 포함 (입력이 더 구체적인 경우)
    // 예: "훈훈한과일(중앙점)" → "훈훈한과일" 포함 ✅
    for (const m of merchants) {
        const normalizedApi = m.가맹점명.replace(/\s+/g, "").toLowerCase();
        if (normalizedInput.includes(normalizedApi) && normalizedApi.length >= 3) {
            const ratio = normalizedApi.length / normalizedInput.length;
            // 매칭 비율 80% 초과이어야 confirmed
            if (ratio > 0.8) {
                return { merchant: m, confidence: "confirmed", matchRatio: ratio };
            } else {
                return { merchant: m, confidence: "uncertain", matchRatio: ratio };
            }
        }
    }

    // 3차: API 가맹점명이 입력을 포함 (API 결과가 더 구체적인 경우)
    for (const m of merchants) {
        const normalizedApi = m.가맹점명.replace(/\s+/g, "").toLowerCase();
        if (normalizedApi.includes(normalizedInput) && normalizedInput.length >= 3) {
            const ratio = normalizedInput.length / normalizedApi.length;
            // 30% 미만은 무시
            if (ratio < 0.3) continue;
            return {
                merchant: m,
                confidence: ratio > 0.8 ? "confirmed" : "uncertain",
                matchRatio: ratio
            };
        }
    }

    // 4차: 핵심 이름으로 매칭
    for (const m of merchants) {
        const normalizedApi = m.가맹점명.replace(/\s+/g, "").toLowerCase();
        if (searchCoreName.length >= 3 && normalizedApi.includes(searchCoreName)) {
            const ratio = searchCoreName.length / normalizedApi.length;
            // 30% 미만은 무시
            if (ratio < 0.3) continue;
            return {
                merchant: m,
                confidence: ratio > 0.8 ? "confirmed" : "uncertain",
                matchRatio: ratio
            };
        }
    }

    return null;
}
