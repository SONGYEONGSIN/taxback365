/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
        ],
    },
    // 프로덕션 빌드에서 console.* 호출 제거 (PII 누수 방지). error는 운영 모니터링용으로 유지.
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    },
    // 보안 헤더. CSP는 1차로 production에서 enforce — Gemini OpenGraph 등 외부 도메인 허용 폭 좁게.
    // 추가 외부 자원이 생기면 connect-src/script-src/img-src 화이트리스트 확장한다.
    async headers() {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://api.dicebear.com https://lh3.googleusercontent.com",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://accounts.google.com https://*.upstash.io https://apis.data.go.kr https://api.odcloud.kr",
            "frame-src 'self' https://accounts.google.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self' https://accounts.google.com",
        ].join('; ');

        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: csp },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default nextConfig;
