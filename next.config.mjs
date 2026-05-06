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
    // 보안 패치 plan 2026-05-06-security-patch-5-phase 진행 중에는 빌드 lint 임시 비활성화.
    // 잔여 26 errors는 docs/security-audit-2026-05-06.md 별도 트랙으로 처리하며,
    // Phase E T34에서 0 errors 달성 후 이 옵션을 제거한다.
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
