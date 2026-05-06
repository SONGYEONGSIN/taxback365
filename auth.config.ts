import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-safe NextAuth 공통 config.
// providers / pages / session 등 미들웨어와 메인 auth.ts에서 함께 쓰는 설정.
// signIn 콜백처럼 supabase-js 같은 무거운 dependency는 auth.ts에서만 추가한다.
export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 60,
    },
    jwt: {
        maxAge: 30 * 60,
    },
} satisfies NextAuthConfig;
