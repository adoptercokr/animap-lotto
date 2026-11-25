import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lotto.animap.co.kr"),
  title: "로또명당 - 전국 로또 1등 명당 지도 · 기간별 순위 · 로또 번호 생성기",
  description:
    "전국 4,735곳 로또 1등 배출 명당 지도, 최근 1년·6개월 신흥 명당 순위, 반자동 로또 번호 뽑기 및 역대 당첨 번호 조회 서비스.",
  keywords: [
    "로또명당",
    "로또명당지도",
    "로또번호생성기",
    "로또1등판매점",
    "최근1년로또명당",
    "내주변로또명당",
    "로또당첨번호",
    "로또반자동번호",
    "로또예상번호",
    "로또자동추첨",
    "서울로또명당",
    "경기로또명당",
    "부산로또명당",
    "인천로또명당",
    "대구로또명당",
    "스파로또",
    "부일카서비스",
    "로또당첨금세금",
    "로또명당순위",
  ],
  alternates: {
    canonical: "https://lotto.animap.co.kr",
  },
  openGraph: {
    title: "로또명당 - 전국 로또 1등 명당 지도 · 로또 번호 생성기",
    description:
      "내 주변 로또 1등 명당을 지도로 찾고, 최근 1년 명당 순위와 반자동 로또 번호 뽑기를 무료로 이용해 보세요.",
    url: "https://lotto.animap.co.kr",
    siteName: "로또명당",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "로또명당 - 전국 로또 1등 명당 지도 · 로또 번호 생성기",
    description:
      "전국 로또 1등 배출 명당 지도와 기간별 순위, 반자동 로또 번호 뽑기를 한 번에 확인하세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://lotto.animap.co.kr/#website",
      name: "로또명당",
      url: "https://lotto.animap.co.kr",
      description:
        "전국 로또 1등 명당 지도, 최근 1년 기간별 명당 순위 및 반자동 로또 번호 생성기",
      inLanguage: "ko-KR",
    },
    {
      "@type": "WebApplication",
      "@id": "https://lotto.animap.co.kr/#webapp",
      name: "로또명당",
      url: "https://lotto.animap.co.kr",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web, iOS, Android",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://lotto.animap.co.kr/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "내 주변 로또 1등 명당은 어떻게 찾나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "로또명당 사이트의 '명당 지도' 탭에서 내 위치 버튼을 누르거나 동네 이름(예: 강남, 노원, 부산)을 검색하면 주변 1등 배출 횟수와 위치를 바로 확인할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "최근 1년 동안 1등이 많이 나온 신흥 로또 명당도 볼 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, '명당 순위'와 '명당 지도' 모두에서 전체 누적뿐만 아니라 최근 1년, 최근 6개월, 최근 3개월 기간별 필터로 1등 배출 명당을 조회할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "원하는 번호만 직접 찍고 나머지는 자동으로 채울 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네, '번호 뽑기' 화면에서 '직접 찍기'를 선택해 원하는 숫자만 고른 뒤 '나머지 자동 채우기' 또는 '나머지 명당 채우기'를 누르면 반자동 조합이 완성됩니다.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="naver-site-verification" content="59b3338af0d78bc1401278938181f424273ebd56" />
        <link rel="help" type="text/plain" title="AI & LLMs Guide (llms.txt)" href="https://lotto.animap.co.kr/llms.txt" />
        <link rel="preconnect" href="https://xdworld.vworld.kr" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
            {/* Google Analytics 4 (GA4) */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-GYXBJK8ZHZ"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GYXBJK8ZHZ');
          `,
        }}
      />
  </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
              {/* Real-time Invisible Visitor Tracker */}
        <img
          src="https://hits.sh/lotto.animap.co.kr.svg?view=today-total"
          alt=""
          width="1"
          height="1"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }}
          loading="eager"
        />
      </body>
    </html>
  );
}
