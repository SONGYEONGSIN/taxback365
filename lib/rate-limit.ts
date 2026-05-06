import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Upstash REST 환경변수가 있을 때만 Redis 인스턴스를 생성한다.
// 없으면 limiter도 null이 되어 가드는 rate-limit를 건너뛴다(인증·zod는 그대로).
// 이 graceful fallback 덕에 로컬 개발/Preview에서 Upstash 미설정 상태로도 빌드/실행 가능.
const hasUpstash = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash ? Redis.fromEnv() : null;

/**
 * 라우트별 rate limiter 생성.
 *
 * @param prefix Upstash 키 prefix (예: "ai-advice", "ocr")
 * @param perMinute 분당 허용 호출 수
 * @returns 환경변수 부재 시 null (rate-limit 비활성화)
 */
export function createLimiter(prefix: string, perMinute: number): Ratelimit | null {
    if (!redis) return null;
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(perMinute, "1 m"),
        analytics: false,
        prefix: `ratelimit:${prefix}`,
    });
}
