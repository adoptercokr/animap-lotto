import { NextResponse } from 'next/server';
import { REGIONS, getAllHistory } from '@/lib/seoData';

export const dynamic = 'force-static';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://lotto.animap.co.kr';
  const history = getAllHistory();
  const latestDraws = history.slice(0, 15);
  const nowRfc = new Date().toUTCString();

  const drawItems = latestDraws.map((draw) => {
    const nums = draw.numbers.join(', ');
    const prize = draw.divisions?.[0]?.prize
      ? `${Math.floor(draw.divisions[0].prize / 100000000)}억 ${Math.floor(
          (draw.divisions[0].prize % 100000000) / 10000
        ).toLocaleString()}만 원`
      : '';
    const winners = draw.divisions?.[0]?.winners || 0;
    const pubDate = draw.date ? new Date(draw.date).toUTCString() : nowRfc;

    return `
    <item>
      <title>${escapeXml(`로또 6/45 제${draw.draw_no}회 1등 당첨 번호 (${nums} + ${draw.bonus_no})`)}</title>
      <link>${baseUrl}/?tab=history#draw-${draw.draw_no}</link>
      <guid isPermaLink="false">${baseUrl}/draw/${draw.draw_no}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(
        `제${draw.draw_no}회 1등 당첨 번호: ${nums} (보너스 ${draw.bonus_no}). 1등 당첨자 ${winners}명, 1인당 당첨금 ${prize}.`
      )}</description>
    </item>`;
  });

  const guideItem = `
    <item>
      <title>${escapeXml('로또 1등 당첨금 실수령액 계산표 · 수령 방법 · 전국 명당 TOP 20 가이드')}</title>
      <link>${baseUrl}/guide</link>
      <guid>${baseUrl}/guide</guid>
      <pubDate>${nowRfc}</pubDate>
      <description>${escapeXml(
        '로또 1등 당첨 시 세율(22%·33%) 실수령액 계산표, 농협 본점·지점 수령 준비물, 최근 1년 신흥 명당 TOP 10 안내.'
      )}</description>
    </item>`;

  const regionItems = REGIONS.map(
    (r) => `
    <item>
      <title>${escapeXml(`${r.fullName} 로또 1등 명당 순위 및 판매점 안내`)}</title>
      <link>${baseUrl}/region/${r.slug}</link>
      <guid>${baseUrl}/region/${r.slug}</guid>
      <pubDate>${nowRfc}</pubDate>
      <description>${escapeXml(
        `${r.fullName} 지역 로또 1등 최다 배출 명당 순위, 최근 1년 신흥 명당 및 위치 안내.`
      )}</description>
    </item>`
  );

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>로또명당 - 전국 로또 1등 명당 지도 및 당첨 번호</title>
    <link>${baseUrl}</link>
    <description>전국 4,735곳 로또 1등 명당 지도, 기간별 명당 순위, 반자동 로또 번호 생성기 및 매주 당첨 결과</description>
    <language>ko</language>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${guideItem}
    ${drawItems.join('\n')}
    ${regionItems.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
