export function WebApplicationJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "TAXAI",
        url: "https://taxai.kr",
        description:
            "AI가 분석하는 맞춤형 연말정산. 기초자료 입력부터 공제 시뮬레이션, 절세 추천까지 한 번에 해결하세요.",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "KRW",
        },
        creator: {
            "@type": "Organization",
            name: "TAXAI",
            url: "https://taxai.kr",
        },
        inLanguage: "ko",
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
    );
}

export function FAQPageJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: "TAXAI는 무료인가요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "네, TAXAI의 기본 연말정산 시뮬레이션 기능은 무료로 제공됩니다. 회원가입 후 바로 이용하실 수 있습니다.",
                },
            },
            {
                "@type": "Question",
                name: "연말정산 예상 환급액은 어떻게 계산하나요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "TAXAI는 2026년 세법 개정안을 반영하여 소득공제와 세액공제 항목을 분석합니다. 급여, 지출, 가족 정보를 입력하면 AI가 최적의 공제 전략과 예상 환급액을 계산해드립니다.",
                },
            },
            {
                "@type": "Question",
                name: "어떤 공제 항목을 지원하나요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "의료비, 교육비, 기부금, 보험료, 신용카드, 주택자금, 연금저축, 월세 등 주요 소득공제 및 세액공제 항목을 모두 지원합니다.",
                },
            },
            {
                "@type": "Question",
                name: "개인정보는 안전하게 보호되나요?",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: "모든 데이터는 암호화되어 안전하게 저장되며, 연말정산 시뮬레이션 목적으로만 사용됩니다. 제3자에게 제공되지 않습니다.",
                },
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
    );
}
