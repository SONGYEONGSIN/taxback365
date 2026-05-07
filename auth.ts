import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { supabaseAdmin } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    callbacks: {
        async signIn({ user }) {
            // 로그인 시 users 테이블에 upsert + 감사 로그 기록
            try {
                const { data: upserted } = await supabaseAdmin
                    .from("users")
                    .upsert(
                        {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            provider: "google",
                            last_login_at: new Date().toISOString(),
                        },
                        { onConflict: "email" }
                    )
                    .select("id")
                    .single();

                await logAudit({
                    action: "login.success",
                    userEmail: user.email ?? null,
                    userId: upserted?.id ?? null,
                });
            } catch (error) {
                console.error("User upsert error:", error);
                await logAudit({
                    action: "login.failure",
                    userEmail: user.email ?? null,
                    metadata: { error: error instanceof Error ? error.message : String(error) },
                });
            }
            return true; // 로그인 허용
        },
        async redirect({ url, baseUrl }) {
            // 로그인 후 대시보드로 리다이렉트
            if (url.startsWith(baseUrl)) return url;
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            return `${baseUrl}/dashboard`;
        },
    },
});
