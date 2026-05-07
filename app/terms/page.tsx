import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function TermsPage() {
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
        <h1 className="text-h1 text-foreground">이용약관</h1>
        <p className="text-caption text-neutral-500 mt-2">
          최종 수정일: 2026년 1월 1일
        </p>
      </div>

      <Card padding="lg" className="space-y-10">
        <section>
          <h2 className="text-h3 text-foreground mb-3">제1조 (목적)</h2>
          <p className="text-body text-neutral-700 leading-[1.7]">
            본 약관은 taxback365(이하 &quot;서비스&quot;)가 제공하는 연말정산
            환급 SaaS의 이용조건 및 절차, 이용자와 서비스 제공자의
            권리·의무·책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제2조 (서비스의 정의)
          </h2>
          <p className="text-body text-neutral-700 leading-[1.7] mb-3">
            taxback365는 다음과 같은 서비스를 제공합니다:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-body text-neutral-700 ml-2">
            <li>연말정산 예상 환급액 계산</li>
            <li>소득공제 및 세액공제 항목 분석</li>
            <li>맞춤형 절세 전략 제안</li>
            <li>2026년 세법 개정안 반영 정보 제공</li>
            <li>카드사 및 금융기관 데이터 연동</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제3조 (이용계약의 성립)
          </h2>
          <p className="text-body text-neutral-700 leading-[1.7]">
            이용계약은 이용자가 본 약관에 동의하고, 서비스에서 정한 절차에 따라
            회원가입을 완료한 시점에 성립됩니다. 이용자는 회원가입 시 정확하고
            최신의 정보를 제공해야 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">제4조 (서비스 이용)</h2>
          <div className="space-y-3 text-body text-neutral-700 leading-[1.7]">
            <p>
              <strong className="text-foreground">1. 서비스 이용 시간:</strong>{" "}
              서비스는 연중무휴 24시간 제공됨을 원칙으로 합니다. 다만, 시스템
              점검 등의 사유로 서비스가 일시 중단될 수 있습니다.
            </p>
            <p>
              <strong className="text-foreground">2. 정보의 정확성:</strong>{" "}
              서비스에서 제공하는 예상 환급액 및 절세 정보는 이용자가 입력한
              정보를 기반으로 계산되며, 실제 국세청 확정 자료와 다를 수
              있습니다.
            </p>
            <p>
              <strong className="text-foreground">3. 세무 상담:</strong> 본
              서비스는 세무 상담 서비스가 아니며, 구체적인 세무 문제는 공인된
              세무사에게 상담하시기 바랍니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">
            제5조 (이용자의 의무)
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-body text-neutral-700 ml-2">
            <li>정확한 개인정보 및 소득정보를 입력해야 합니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.</li>
            <li>서비스를 부정한 목적으로 이용해서는 안 됩니다.</li>
            <li>서비스의 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">제6조 (면책조항)</h2>
          <div className="rounded-md bg-warning/8 border border-warning/30 p-4">
            <p className="text-body text-neutral-700 leading-[1.7]">
              서비스는 이용자가 입력한 정보를 기반으로 예상 환급액을 계산하며,
              이는 참고용 정보입니다. 실제 세금 신고 및 환급은 국세청의 확정
              자료에 따라 결정되며, 서비스는 계산 결과의 정확성에 대해 법적
              책임을 지지 않습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-h3 text-foreground mb-3">제7조 (약관의 변경)</h2>
          <p className="text-body text-neutral-700 leading-[1.7]">
            서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을
            변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해
            공지합니다.
          </p>
        </section>

        <div className="border-t border-neutral-200 pt-6 mt-2">
          <p className="text-body-sm text-neutral-500 text-center">
            본 약관에 대한 문의사항은{" "}
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
