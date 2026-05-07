import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <div className="max-w-[680px] mx-auto animate-fade-in">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          홈으로 돌아가기
        </Link>
        <h1 className="text-h1 text-foreground">개인정보처리방침</h1>
        <p className="text-caption text-neutral-500 mt-2">
          최종 수정일: 2026년 1월 1일
        </p>
      </div>

      <Card padding="lg" className="space-y-10">
        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제1조 (개인정보의 수집 및 이용 목적)
          </h2>
          <p className="text-body text-neutral-700 leading-[1.7] mb-3">
            taxback365는 다음 목적을 위해 개인정보를 수집·이용합니다:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-body text-neutral-700 ml-2">
            <li>회원 식별 및 회원제 서비스 이용</li>
            <li>연말정산 예상 환급액 계산 서비스 제공</li>
            <li>맞춤형 절세 전략 분석</li>
            <li>서비스 개선 및 신규 기능 개발</li>
            <li>고객 문의 응대 및 공지사항 전달</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제2조 (수집하는 개인정보 항목)
          </h2>
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700 w-32">
                    구분
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                    수집 항목
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    필수 정보
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    이름, 이메일, 비밀번호
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    소득 정보
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    급여, 비과세 소득, 국민연금, 건강보험료
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    지출 정보
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    신용카드·체크카드 사용액, 현금영수증, 의료비, 교육비
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">
                    자동 수집
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    접속 IP, 서비스 이용 기록, 접속 로그
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제3조 (개인정보의 보유 및 이용 기간)
          </h2>
          <div className="space-y-3 text-body text-neutral-700 leading-[1.7]">
            <p>
              <strong className="text-foreground">1. 회원 정보:</strong> 회원
              탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.
            </p>
            <p>
              <strong className="text-foreground">2. 소득·지출 데이터:</strong>{" "}
              연말정산 완료 후 최대 5년간 보관 (국세기본법에 따른 보관 의무)
            </p>
            <p>
              <strong className="text-foreground">3. 서비스 이용 기록:</strong>{" "}
              3년간 보관 후 파기
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제4조 (개인정보의 제3자 제공)
          </h2>
          <div className="rounded-md bg-mint/8 border border-mint/30 p-4 space-y-2">
            <p className="text-body text-foreground font-medium">
              taxback365는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지
              않습니다.
            </p>
            <p className="text-body-sm text-neutral-700">
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside space-y-1 text-body-sm text-neutral-700 ml-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 의해 요구되는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제5조 (개인정보의 안전성 확보 조치)
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-body text-neutral-700 ml-2">
            <li>개인정보 암호화 저장 (AES-256)</li>
            <li>SSL/TLS를 통한 데이터 전송 암호화</li>
            <li>정기적인 보안 점검 및 취약점 분석</li>
            <li>개인정보 접근 권한 최소화 및 접근 기록 관리</li>
            <li>해킹 등에 대비한 방화벽 운영</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제6조 (이용자의 권리)
          </h2>
          <p className="text-body text-neutral-700 leading-[1.7] mb-3">
            이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-body text-neutral-700 ml-2">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리정지 요구</li>
          </ul>
          <p className="text-body text-neutral-700 leading-[1.7] mt-3">
            위 권리 행사는 서비스 내 &quot;설정 &gt; 개인정보 관리&quot; 메뉴
            또는 고객센터를 통해 가능합니다.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제7조 (개인정보 보호책임자)
          </h2>
          <div className="rounded-md bg-neutral-100 border border-neutral-200 p-4">
            <p className="font-medium text-foreground mb-2">
              개인정보 보호책임자
            </p>
            <ul className="text-body-sm text-neutral-700 space-y-1">
              <li>담당: 개인정보보호팀</li>
              <li className="font-mono">이메일: ysong2526@gmail.com</li>
            </ul>
          </div>
        </section>

        <div className="border-t border-neutral-200 pt-6 mt-2">
          <p className="text-body-sm text-neutral-500 text-center">
            개인정보 처리에 관한 문의사항은{" "}
            <span className="font-mono text-foreground">
              ysong2526@gmail.com
            </span>
            으로 연락 주시기 바랍니다.
          </p>
        </div>
      </Card>
    </div>
  );
}
