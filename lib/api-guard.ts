import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Ratelimit } from "@upstash/ratelimit";
import type { ZodSchema } from "zod";

interface GuardOptions<T> {
    /** 라우트별 rate limiter (null이면 rate-limit 건너뜀). */
    limiter?: Ratelimit | null;
    /** 요청 body 검증용 zod schema. POST/PUT/PATCH에서만 적용. */
    schema?: ZodSchema<T>;
}

interface GuardContext<T> {
    email: string;
    body: T;
}

/**
 * 외부 호출/비용 발생 라우트용 가드 HOF.
 * 1. NextAuth 세션 → 미인증 시 401
 * 2. (옵션) per-user rate limit → 초과 시 429
 * 3. (옵션) zod schema 검증 → 실패 시 400
 *
 * Usage:
 *   const limiter = createLimiter("ai-advice", 10);
 *   const schema = z.object({ ... });
 *   export const POST = withApiGuard<MyBody>(async (req, ctx) => {
 *     // ctx.email, ctx.body 사용
 *     return NextResponse.json({ ok: true });
 *   }, { limiter, schema });
 */
export function withApiGuard<T = unknown>(
    handler: (req: NextRequest, ctx: GuardContext<T>) => Promise<NextResponse>,
    opts: GuardOptions<T> = {}
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        // 1) 인증
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const email = session.user.email;

        // 2) Rate limit (사용자별)
        if (opts.limiter) {
            const result = await opts.limiter.limit(email);
            if (!result.success) {
                return NextResponse.json(
                    {
                        error: "Too many requests",
                        retryAfterSeconds: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
                    },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
                        },
                    }
                );
            }
        }

        // 3) body schema 검증 (POST/PUT/PATCH만)
        let body: T = undefined as T;
        const hasBody = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
        if (opts.schema && hasBody) {
            let raw: unknown;
            try {
                raw = await req.json();
            } catch {
                return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
            }
            const parsed = opts.schema.safeParse(raw);
            if (!parsed.success) {
                return NextResponse.json(
                    { error: "Invalid request body", issues: parsed.error.issues },
                    { status: 400 }
                );
            }
            body = parsed.data;
        }

        return handler(req, { email, body });
    };
}
