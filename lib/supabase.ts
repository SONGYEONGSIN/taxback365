import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public anon client — RLS 정책에 따라 권한이 제한됨. 클라이언트/공개 라우트에서 사용 가능.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only privileged client — RLS를 우회한다. 브라우저 번들에 포함되지 않도록 server route에서만 import 한다.
// SUPABASE_SERVICE_ROLE_KEY (NOT NEXT_PUBLIC_) 필요.
export const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);
