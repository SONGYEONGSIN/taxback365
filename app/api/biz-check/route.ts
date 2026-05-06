import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiGuard } from "@/lib/api-guard";
import { createLimiter } from "@/lib/rate-limit";

const NTS_API_KEY = process.env.NTS_API_KEY;
const BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";

interface BizStatusResult {
    bizNo: string;
    taxType: string;        // 과세유형: "부가가치세 일반과세자", "부가가치세 면세사업자" 등
    taxTypeCode: string;    // 과세유형코드: "01"=일반, "02"=간이, "03"=과세특례, "04"=면세, "05"=비영리법인, "06"=고유번호단체, "07"=간이(세금계산서발급)
    status: string;         // 사업상태: "계속사업자", "휴업자", "폐업자"
    statusCode: string;     // 상태코드: "01"=계속, "02"=휴업, "03"=폐업
}

const bizCheckSchema = z.object({
    bizNumbers: z.array(z.string().regex(/^\d{10}$/)).min(1).max(500),
});

type BizCheckRequest = z.infer<typeof bizCheckSchema>;

const limiter = createLimiter("biz-check", 30);

/**
 * 사업자등록번호 일괄 상태 조회
 * POST /api/biz-check
 * Body: { bizNumbers: string[] }
 *
 * 국세청 사업자등록정보 상태조회 API를 활용하여
 * 과세유형(일반/간이/면세)과 사업 상태를 조회합니다.
 *
 * 면세사업자 = 의료기관/교육기관/농업 등의 가능성이 높음
 */
export const POST = withApiGuard<BizCheckRequest>(async (_req, ctx) => {
    try {
        const { bizNumbers } = ctx.body;

        if (!NTS_API_KEY) {
            console.warn("[Biz Check] NTS_API_KEY not configured, skipping NTS verification");
            return NextResponse.json({
                results: bizNumbers.map(bizNo => ({
                    bizNo,
                    taxType: "unknown",
                    taxTypeCode: "",
                    status: "unknown",
                    statusCode: "",
                    isTaxFree: false,
                    reason: "api_key_missing"
                })),
                summary: {
                    total: bizNumbers.length,
                    taxFreeCount: 0,
                    activeCount: 0,
                    apiKeyMissing: true
                }
            });
        }

        // 국세청 API는 한 번에 최대 100건 조회 가능
        const BATCH_SIZE = 100;
        const allResults: BizStatusResult[] = [];

        for (let i = 0; i < bizNumbers.length; i += BATCH_SIZE) {
            const batch = bizNumbers.slice(i, i + BATCH_SIZE);
            const batchResults = await queryNtsBizStatus(batch);
            allResults.push(...batchResults);
        }

        const taxFreeCount = allResults.filter(r => r.taxTypeCode === "04").length;
        const activeCount = allResults.filter(r => r.statusCode === "01").length;

        console.log(`[Biz Check] 조회 완료: ${allResults.length}건 (면세: ${taxFreeCount}, 활성: ${activeCount})`);

        return NextResponse.json({
            results: allResults.map(r => ({
                ...r,
                isTaxFree: r.taxTypeCode === "04",  // 면세사업자 여부 (코드 04)
            })),
            summary: {
                total: allResults.length,
                taxFreeCount,
                activeCount
            }
        });

    } catch (error) {
        console.error("[Biz Check] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}, { limiter, schema: bizCheckSchema });

/**
 * 국세청 사업자등록정보 상태조회 API 호출
 */
async function queryNtsBizStatus(bizNumbers: string[]): Promise<BizStatusResult[]> {
    try {
        const url = `${BASE_URL}/status?serviceKey=${encodeURIComponent(NTS_API_KEY!)}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                b_no: bizNumbers  // 사업자등록번호 배열
            })
        });

        if (!response.ok) {
            console.error("[Biz Check] HTTP Error:", response.status);
            return bizNumbers.map(bizNo => ({
                bizNo,
                taxType: "error",
                taxTypeCode: "",
                status: "error",
                statusCode: "",
            }));
        }

        const data = await response.json();

        if (data.status_code !== "OK") {
            console.error("[Biz Check] API Error:", data);
            return bizNumbers.map(bizNo => ({
                bizNo,
                taxType: "error",
                taxTypeCode: "",
                status: "error",
                statusCode: "",
            }));
        }

        // API 응답 파싱
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.data || []).map((item: any) => ({
            bizNo: item.b_no || "",
            taxType: item.tax_type || "",           // "부가가치세 일반과세자", "부가가치세 면세사업자" 등
            taxTypeCode: item.tax_type_cd || "",    // "01", "02", "03" 등
            status: item.b_stt || "",               // "계속사업자" 등
            statusCode: item.b_stt_cd || "",        // "01" 등
        }));

    } catch (error) {
        console.error("[Biz Check] Query error:", error);
        return bizNumbers.map(bizNo => ({
            bizNo,
            taxType: "error",
            taxTypeCode: "",
            status: "error",
            statusCode: "",
        }));
    }
}
