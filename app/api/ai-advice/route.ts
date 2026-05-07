import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiGuard } from '@/lib/api-guard';
import { createLimiter } from '@/lib/rate-limit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const aiAdviceSchema = z.object({
    salary: z.number().nonnegative().max(1_000_000_000),
    deductionItems: z.array(z.object({
        category: z.string().max(50),
        type: z.string().max(50),
        amount: z.number().nonnegative(),
        limit: z.number().nonnegative(),
        status: z.string().max(50),
    })).max(50),
    currentRefund: z.number(),
    prepaidTax: z.number().nonnegative(),
});

type AIAdviceRequest = z.infer<typeof aiAdviceSchema>;

const limiter = createLimiter('ai-advice', 10);

export const POST = withApiGuard<AIAdviceRequest>(async (_req, ctx) => {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        const { salary, deductionItems, currentRefund, prepaidTax } = ctx.body;

        // 공제 항목별 요약 생성
        const deductionSummary = deductionItems.map(item => {
            const utilizationRate = item.limit > 0 ? Math.round((item.amount / item.limit) * 100) : 100;
            return `- ${item.category}: ${item.amount.toLocaleString()}원 / ${item.limit.toLocaleString()}원 한도 (${utilizationRate}% 활용, 상태: ${item.status})`;
        }).join('\n');

        const prompt = `당신은 한국 세무 전문가입니다. 아래 사용자의 연말정산 데이터를 분석하고 맞춤형 절세 전략을 제안해주세요.

## 사용자 정보
- 총급여: ${salary.toLocaleString()}원
- 기납부세액: ${prepaidTax.toLocaleString()}원
- 현재 예상 환급액: ${currentRefund.toLocaleString()}원

## 공제 항목별 현황
${deductionSummary}

## 요청사항
위 데이터를 분석하여 다음 내용을 포함한 개인화된 절세 조언을 제공해주세요:

1. **핵심 전략 요약** (2-3문장): 가장 효과적인 절세 방법
2. **우선순위별 실행 항목** (최대 3개): 구체적인 실행 가이드
3. **주의사항**: 해당 급여구간에서 알아야 할 세율 정보나 공제 한도

응답은 한국어로 작성하고, 전문적이면서도 이해하기 쉽게 설명해주세요.
마크다운 형식으로 작성하되, 불필요한 장식은 피하고 실용적인 내용에 집중해주세요.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    // gemini-2.5-flash는 thinking 모드가 기본 ON. 1024 토큰이 thinking에 거의 다 소비되어
                    // 실제 출력이 잘리는 것을 방지하기 위해 thinking 비활성화.
                    thinkingConfig: { thinkingBudget: 0 },
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json(
                { error: 'AI 분석 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        const responseData = await response.json();
        const advice = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!advice) {
            return NextResponse.json(
                { error: 'AI 응답을 받지 못했습니다.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            advice,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI Advice API Error:', error);
        return NextResponse.json(
            { error: 'AI 조언 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}, { limiter, schema: aiAdviceSchema });
