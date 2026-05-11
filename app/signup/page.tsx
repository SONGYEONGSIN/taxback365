"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

function LogoMark() {
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M5 4 L19 4" />
      <path d="M5 12 L19 12" />
      <path d="M5 20 L19 20" className="text-fresh-green" />
      <path d="M12 4 L12 20" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.81z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      className="w-[18px] h-[18px]"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (formData.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    router.push("/dashboard");
  };

  const fieldClass =
    "w-full h-11 rounded-md border border-border-light bg-canvas-white px-3.5 text-body text-ink-black placeholder:text-steel-gray hover:border-border-muted focus-visible:outline-none focus-visible:border-focus-ring-blue focus-visible:ring-2 focus-visible:ring-focus-ring-blue/30 transition-colors";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in px-4 py-10">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink-black hover:opacity-80 transition-opacity mb-6"
            aria-label="taxback365 홈"
          >
            <LogoMark />
          </Link>
          <h1 className="text-h1 text-ink-black">계정 만들기</h1>
          <p className="text-body-sm text-shadow-gray mt-2">
            무료로 시작하고 환급 가능 금액을 확인하세요.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-canvas-white rounded-lg border border-border-light p-7 space-y-5">
          <div className="space-y-2.5">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-md border border-border-light bg-canvas-white text-body-sm font-medium text-ink-black hover:bg-subtle-ash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue focus-visible:ring-offset-2"
            >
              <GoogleIcon />
              Google로 시작하기
            </button>
            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-md bg-ink-black text-canvas-white text-body-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-blue focus-visible:ring-offset-2"
            >
              <GithubIcon />
              GitHub로 시작하기
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-canvas-white px-3 text-caption text-shadow-gray">
                또는 이메일로
              </span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-body-sm font-medium text-ink-black"
              >
                이름
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-email"
                className="text-body-sm font-medium text-ink-black"
              >
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-password"
                className="text-body-sm font-medium text-ink-black"
              >
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="최소 8자"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-confirm"
                className="text-body-sm font-medium text-ink-black"
              >
                비밀번호 확인
              </label>
              <input
                id="signup-confirm"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="다시 한 번 입력"
                className={`${fieldClass} ${error ? "border-warm-orange focus-visible:border-warm-orange focus-visible:ring-danger/25" : ""}`}
              />
            </div>

            {error && (
              <div className="rounded-md border border-warm-orange/30 bg-warm-orange/8 p-3 flex items-start gap-2 text-body-sm text-warm-orange">
                <AlertTriangle
                  size={16}
                  strokeWidth={1.75}
                  className="mt-0.5 flex-shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border-muted text-ink-black focus:ring-focus-ring-blue"
              />
              <span className="text-body-sm text-thunder-gray leading-[1.5]">
                <Link
                  href="/terms"
                  className="text-accent-blue hover:text-ink-black transition-colors"
                >
                  이용약관
                </Link>{" "}
                및{" "}
                <Link
                  href="/privacy"
                  className="text-accent-blue hover:text-ink-black transition-colors"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={!agreeTerms}
            >
              무료로 시작
            </Button>
          </form>
        </div>

        <p className="text-center text-body-sm text-shadow-gray mt-6">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-blue hover:text-ink-black transition-colors"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
