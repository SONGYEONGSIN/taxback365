"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  ClipboardList,
  Clock,
  MessageSquareText,
} from "lucide-react";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

const SESSION_TIMEOUT = 30 * 60; // 30분 (초)

/** 임시 인라인 로고 — Phase 5 (T25) 에서 /public/logo.svg 로 분리 예정.
 *  ㅌ 자모: 가로획 3 (마지막만 Mint) + 세로획 1. */
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M5 4 L19 4" />
      <path d="M5 12 L19 12" />
      {/* 마지막 가로획 — Mint 액센트 */}
      <path d="M5 20 L19 20" className="text-mint" stroke="currentColor" />
      <path d="M12 4 L12 20" />
    </svg>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLanding = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const showMobileNav = !isLanding && !isAuthPage;

  const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);
  const resetTimer = useCallback(() => setRemainingTime(SESSION_TIMEOUT), []);

  useEffect(() => {
    if (!session) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          signOut({ callbackUrl: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session, resetTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeWarning = remainingTime <= 5 * 60;

  const desktopNavItems: Array<{
    href: string;
    label: string;
    matcher: (p: string) => boolean;
  }> = [
    {
      href: "/dashboard",
      label: "대시보드",
      matcher: (p) => p === "/dashboard",
    },
    {
      href: "/calculator",
      label: "계산기",
      matcher: (p) => p === "/calculator",
    },
    {
      href: "/admin",
      label: "기초자료",
      matcher: (p) => p.startsWith("/admin"),
    },
    { href: "/board", label: "게시판", matcher: (p) => p.startsWith("/board") },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 h-16 bg-card/85 backdrop-blur-md border-b border-neutral-200">
        <div className="container mx-auto h-full px-4 md:px-6 max-w-6xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity shrink-0"
            aria-label="taxback365 홈"
          >
            <LogoMark />
            <span className="font-display font-semibold text-[17px] tracking-[-0.02em]">
              taxback365
            </span>
          </Link>

          {/* Desktop Nav */}
          {!isLanding && !isAuthPage && (
            <div className="hidden md:flex items-center gap-1">
              {desktopNavItems.map((item) => {
                const active = item.matcher(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "relative px-3 py-2 rounded-md text-body-sm font-medium transition-colors duration-150",
                      active
                        ? "text-foreground after:absolute after:left-3 after:right-3 after:-bottom-[1.05rem] after:h-[2px] after:bg-primary"
                        : "text-neutral-700 hover:text-foreground hover:bg-neutral-100",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-body-sm font-medium text-foreground">
                    {session.user?.name || "사용자"}님
                  </span>
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-caption font-medium",
                      isTimeWarning
                        ? "bg-danger/10 text-danger"
                        : "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    <Clock size={11} strokeWidth={2} />
                    <span className="font-mono tabular-nums">
                      {formatTime(remainingTime)}
                    </span>
                  </span>
                </div>
                <div className="w-8 h-8 rounded-pill border border-neutral-200 bg-neutral-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      session.user?.image ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  로그아웃
                </Button>
              </>
            ) : isLanding || isAuthPage ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 px-3.5 rounded-md text-body-sm font-medium text-foreground hover:bg-neutral-100 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md text-body-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-700 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-neutral-200 shadow-floating">
          <div className="flex justify-around items-center h-16 px-2">
            {[
              {
                href: "/dashboard",
                label: "대시보드",
                Icon: LayoutDashboard,
                active: pathname === "/dashboard",
              },
              {
                href: "/calculator",
                label: "계산기",
                Icon: Calculator,
                active: pathname === "/calculator",
              },
              {
                href: "/admin",
                label: "기초자료",
                Icon: ClipboardList,
                active: pathname.startsWith("/admin"),
              },
              {
                href: "/board",
                label: "게시판",
                Icon: MessageSquareText,
                active: pathname.startsWith("/board"),
              },
            ].map(({ href, label, Icon, active }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded-md transition-colors",
                  active
                    ? "text-primary"
                    : "text-neutral-500 hover:text-foreground",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                <span
                  className={clsx(
                    "text-[11px]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
