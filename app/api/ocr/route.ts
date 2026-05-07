import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiGuard } from '@/lib/api-guard';
import { createLimiter } from '@/lib/rate-limit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// gemini-2.0-flash 모델 사용 (Vision 지원)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface OcrItem {
    category: string;
    merchant: string;
    amount: number;
}

// base64 이미지 1장의 상한: 약 4MB raw → ≈ 5.5MB base64. 안전하게 6_000_000자.
const ocrSchema = z.object({
    images: z.array(z.string().max(6_000_000)).min(1).max(10),
});

type OcrRequest = z.infer<typeof ocrSchema>;

const limiter = createLimiter('ocr', 5);

export const POST = withApiGuard<OcrRequest>(async (_req, ctx) => {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        const { images } = ctx.body;
        const allItems: OcrItem[] = [];

        for (const imageBase64 of images) {
            // base64 데이터에서 prefix 제거
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

            const prompt = `이 이미지는 영수증, 카드 명세서, 또는 지출 관련 문서입니다.
이미지에서 지출 항목을 추출하여 JSON 배열로 반환해주세요.

각 항목은 다음 형식으로 반환해주세요:
{
    "category": "카테고리명",
    "merchant": "가맹점/상호명",
    "amount": 금액(숫자만)
}

카테고리는 반드시 다음 중 하나를 선택해주세요:
- "신용카드": 일반 신용카드 결제
- "체크카드": 체크카드/직불카드 결제
- "현금영수증": 현금영수증 발행 결제
- "대중교통": 버스, 지하철, 택시, KTX 등 교통수단
- "보험료": 보험사 납입금
- "의료비": 병원, 약국, 의원 등 의료비 지출
- "전통시장": 전통시장, 재래시장 지출
- "문화체육": 영화관, 서점, 헬스장, 공연 등

금액은 반드시 숫자만 포함해주세요 (쉼표, '원' 제거).
가맹점명이 불분명하면 "-"로 표시해주세요.

응답은 반드시 JSON 배열만 반환해주세요. 다른 텍스트 없이 오직 JSON 배열만요.
예시: [{"category": "신용카드", "merchant": "스타벅스", "amount": 5500}]

만약 이미지에서 지출 항목을 찾을 수 없다면 빈 배열 []을 반환해주세요.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096,
                        // gemini-2.5-flash thinking 비활성화 (출력 truncation 방지).
                        thinkingConfig: { thinkingBudget: 0 },
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Gemini API Error:', errorData);
                continue;
            }

            const data = await response.json();
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

            // JSON 파싱 시도
            try {
                // 마크다운 코드 블록 제거
                let jsonStr = textContent.trim();
                if (jsonStr.startsWith('```json')) {
                    jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '');
                } else if (jsonStr.startsWith('```')) {
                    jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '');
                }

                const items = JSON.parse(jsonStr);
                if (Array.isArray(items)) {
                    allItems.push(...items.map((item: OcrItem) => ({
                        category: item.category || '신용카드',
                        merchant: item.merchant || '-',
                        amount: typeof item.amount === 'number' ? item.amount : parseInt(String(item.amount).replace(/[^0-9]/g, '')) || 0
                    })).filter((item: OcrItem) => item.amount > 0));
                }
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError, 'Content:', textContent);
            }
        }

        return NextResponse.json({ items: allItems });

    } catch (error) {
        console.error('OCR API Error:', error);
        return NextResponse.json(
            { error: 'OCR 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}, { limiter, schema: ocrSchema });
