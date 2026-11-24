import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lotto.animap.co.kr"),
  title: "로또 명당 지도 & AI 번호 발행기 | ANIMAP LOTTO",
  description: "이번 주 1등 번호 뽑기, 전국 로또 1·2등 명당 순위 및 내 주변 명당 지도 찾기",
  keywords: ["로또번호생성기", "로또명당", "로또지도", "로또1등판매점", "AI로또", "애니맵로또"],
  openGraph: {
    title: "로또 명당 지도 & AI 번호 발행기 | ANIMAP LOTTO",
    description: "명당의 기운을 담아 이번 주 1등 번호를 뽑고, 내 주변 1등 명당을 찾아보세요!",
    url: "https://lotto.animap.co.kr",
    siteName: "ANIMAP LOTTO",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://xdworld.vworld.kr" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
