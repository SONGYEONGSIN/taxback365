import Link from "next/link";

function LogoMark({ size = 20 }: { size?: number }) {
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
      <path d="M5 20 L19 20" className="text-mint" stroke="currentColor" />
      <path d="M12 4 L12 20" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-card mt-auto">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            >
              <LogoMark />
              <span className="font-display font-semibold text-[17px] tracking-[-0.02em]">
                taxback365
              </span>
            </Link>
            <p className="mt-3 text-body-sm text-neutral-500 leading-relaxed">
              한국 직장인을 위한
              <br />
              연말정산 환급 SaaS.
            </p>
          </div>

          <div>
            <h4 className="text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em] mb-4">
              서비스
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="text-body-sm text-neutral-700 hover:text-foreground transition-colors"
                >
                  기능 소개
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-body-sm text-neutral-700 hover:text-foreground transition-colors"
                >
                  요금 안내
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-body-sm text-neutral-700 hover:text-foreground transition-colors"
                >
                  자주 묻는 질문
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em] mb-4">
              법적 고지
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/terms"
                  className="text-body-sm text-neutral-700 hover:text-foreground transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-body-sm text-neutral-700 hover:text-foreground transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-caption font-semibold text-neutral-500 uppercase tracking-[0.06em] mb-4">
              문의
            </h4>
            <ul className="space-y-2.5">
              <li className="text-body-sm text-neutral-700 font-mono">
                ysong2526@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-12 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-caption text-neutral-500">
            © 2026 taxback365. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6435&cntntsId=7871"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-9 px-3.5 rounded-md border border-neutral-200 text-body-sm text-neutral-700 hover:bg-neutral-100 hover:text-foreground transition-colors"
            >
              국세청
            </a>
            <a
              href="https://www.koreatax.org/tax/index.php3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-9 px-3.5 rounded-md border border-neutral-200 text-body-sm text-neutral-700 hover:bg-neutral-100 hover:text-foreground transition-colors"
            >
              한국납세자연맹
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
