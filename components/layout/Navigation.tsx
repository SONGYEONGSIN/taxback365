"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calculator, LayoutDashboard, ClipboardList, Clock, MessageSquareText } from "lucide-react";
import clsx from "clsx";
import { useSession, signOut } from "next-auth/react";

const SESSION_TIMEOUT = 30 * 60; // 30분 (초)

export function Navigation() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isLanding = pathname === "/";
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const showMobileNav = !isLanding && !isAuthPage;

    // 세션 남은 시간 카운트다운
    const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);

    const resetTimer = useCallback(() => {
        setRemainingTime(SESSION_TIMEOUT);
    }, []);

    useEffect(() => {
        if (!session) return;

        // 사용자 활동 감지 → 타이머 리셋
        const events = ["mousedown", "keydown", "scroll", "touchstart"];
        events.forEach((event) => window.addEventListener(event, resetTimer));

        // 1초마다 카운트다운
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

    const isTimeWarning = remainingTime <= 5 * 60; // 5분 이하 경고

    return (
        <>
            <nav className="border-b-[3px] border-black bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-0 hover:scale-105 transition-transform shrink-0"
                    >
                        <Image
                            src="/logo.png"
                            alt="TAXAI 로고"
                            width={64}
                            height={64}
                            className="rounded-lg"
                        />
                        <span className="font-head text-xl font-black tracking-tighter whitespace-nowrap">
                            TAX<span className="text-neo-orange">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    {!isLanding && !isAuthPage && (
                        <div className="hidden md:flex gap-2">
                            <Link
                                href="/dashboard"
                                className={clsx(
                                    "neo-nav-item",
                                    pathname === "/dashboard" && "active"
                                )}
                            >
                                DASHBOARD
                            </Link>
                            <Link
                                href="/calculator"
                                className={clsx(
                                    "neo-nav-item",
                                    pathname === "/calculator" && "active"
                                )}
                            >
                                CALCULATOR
                            </Link>
                            <Link
                                href="/admin"
                                className={clsx(
                                    "neo-nav-item",
                                    pathname === "/admin" && "active"
                                )}
                            >
                                ADMIN
                            </Link>
                            <Link
                                href="/board"
                                className={clsx(
                                    "neo-nav-item",
                                    pathname.startsWith("/board") && "active"
                                )}
                            >
                                BOARD
                            </Link>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {session ? (
                            // 로그인 상태: 모든 페이지에서 사용자 정보 표시
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="hidden md:inline font-bold text-sm">
                                        {session.user?.name || "사용자"}님
                                    </span>
                                    <div className={clsx(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border",
                                        isTimeWarning
                                            ? "bg-red-50 text-red-600 border-red-300 animate-pulse"
                                            : "bg-gray-100 text-gray-500 border-gray-200"
                                    )}>
                                        <Clock size={12} />
                                        <span>{formatTime(remainingTime)}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-200 overflow-hidden">
                                    {/* Google avatar는 동적 외부 URL이라 next/image 도메인 화이트리스트 추가가 필요. follow-up. */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={session.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                        alt="User"
                                    />
                                </div>

                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="px-2 py-1.5 md:px-3 font-bold text-xs md:text-sm border-2 border-black bg-white hover:bg-red-100 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all whitespace-nowrap"
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : isLanding || isAuthPage ? (
                            // 비로그인 상태 + 메인/인증 페이지: 로그인/회원가입 버튼
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 font-black border-2 border-black bg-neo-yellow hover:bg-yellow-400 text-sm shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                >
                                    로그인
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 font-black border-2 border-black bg-white hover:bg-gray-100 text-sm shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
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
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[3px] border-black">
                    <div className="flex justify-around items-center h-16">
                        <Link
                            href="/dashboard"
                            className={clsx(
                                "flex flex-col items-center justify-center flex-1 h-full transition-all",
                                pathname === "/dashboard"
                                    ? "bg-neo-yellow text-black"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            <LayoutDashboard size={22} strokeWidth={pathname === "/dashboard" ? 2.5 : 2} />
                            <span className="text-xs font-bold mt-1">대시보드</span>
                        </Link>
                        <Link
                            href="/calculator"
                            className={clsx(
                                "flex flex-col items-center justify-center flex-1 h-full transition-all",
                                pathname === "/calculator"
                                    ? "bg-neo-cyan text-black"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            <Calculator size={22} strokeWidth={pathname === "/calculator" ? 2.5 : 2} />
                            <span className="text-xs font-bold mt-1">계산기</span>
                        </Link>
                        <Link
                            href="/admin"
                            className={clsx(
                                "flex flex-col items-center justify-center flex-1 h-full transition-all",
                                pathname === "/admin"
                                    ? "bg-neo-orange text-black"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            <ClipboardList size={22} strokeWidth={pathname === "/admin" ? 2.5 : 2} />
                            <span className="text-xs font-bold mt-1">기초자료</span>
                        </Link>
                        <Link
                            href="/board"
                            className={clsx(
                                "flex flex-col items-center justify-center flex-1 h-full transition-all",
                                pathname.startsWith("/board")
                                    ? "bg-neo-pink text-black"
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            <MessageSquareText size={22} strokeWidth={pathname.startsWith("/board") ? 2.5 : 2} />
                            <span className="text-xs font-bold mt-1">게시판</span>
                        </Link>
                    </div>
                </nav>
            )}
        </>
    );
}
