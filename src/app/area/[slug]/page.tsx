import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SubHeader from '@/components/SubHeader';
import { AREAS, REGIONS, getAllStores } from '@/lib/seoData';

export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = AREAS.find((a) => a.slug === slug);
  if (!area) return {};

  const stores = getAllStores()
    .filter((s) => s.reg === area.reg && s.sig === area.sig)
    .sort((a, b) => b.cnt - a.cnt);

  const top = stores[0];
  const title = `${area.reg} ${area.sig} 로또 명당 · 1등 배출 판매점 (${stores.length}곳) | 로또명당`;
  const description = `${area.reg} ${area.sig} 로또 1등 판매점 리스트 및 위치 안내. 최다 배출 명당 ${
    top ? `${top.name}(1등 ${top.cnt}회)` : ''
  } 외 ${stores.length}곳의 자동·수동 당첨 이력을 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${area.sig} 로또 명당`,
      `${area.reg} ${area.sig} 로또 명당`,
      `${area.sig} 로또 1등 판매점`,
      `${area.sig} 복권방`,
      '로또명당',
    ],
    alternates: {
      canonical: `https://lotto.animap.co.kr/area/${area.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://lotto.animap.co.kr/area/${area.slug}`,
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = AREAS.find((a) => a.slug === slug);
  if (!area) notFound();

  const region = REGIONS.find((r) => r.slug === area.regSlug);
  const areaStores = getAllStores()
    .filter((s) => s.reg === area.reg && s.sig === area.sig)
    .sort((a, b) => b.cnt - a.cnt);

  const total1st = areaStores.reduce((acc, s) => acc + s.cnt, 0);
  const siblingAreas = AREAS.filter((a) => a.regSlug === area.regSlug && a.slug !== area.slug).slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SubHeader current="area" />

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-[#10b981] mb-1">
            {area.reg} &gt; {area.sig}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            {area.reg} {area.sig} 로또 1등 명당 ({areaStores.length}곳)
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {area.reg} {area.sig} 내 로또 1등을 1회 이상 배출한 판매점은 총{' '}
            <strong>{areaStores.length}곳</strong>이며, 누적 1등 당첨 횟수는{' '}
            <strong>{total1st}회</strong>입니다.
            {areaStores[0] && (
              <>
                {' '}1위 판매점은 <strong>{areaStores[0].name}</strong>(1등 {areaStores[0].cnt}회)입니다.
              </>
            )}
          </p>
        </section>

        {/* 판매점 전체 목록 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black text-slate-900 mb-4">
            {area.sig} 1등 배출 판매점 목록
          </h2>
          <div className="divide-y divide-slate-100">
            {areaStores.map((s, idx) => (
              <div
                key={s.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-500">{idx + 1}.</span>
                    <strong className="text-base sm:text-lg font-extrabold text-slate-900">
                      {s.name}
                    </strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-xs font-extrabold">
                      1등 {s.cnt}회
                    </span>
                    {(s.c1y || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                        최근 1년 {s.c1y}회
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{s.addr}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    자동 {s.auto}회 · 수동 {s.cnt - s.auto}회
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-[#FEE500] text-[#191919] text-xs font-extrabold"
                  >
                    카카오맵
                  </a>
                  <a
                    href={`https://map.naver.com/v5/search/${encodeURIComponent(s.addr + ' ' + s.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-[#03C75A] text-white text-xs font-extrabold"
                  >
                    네이버지도
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 인근 지역 링크 */}
        {siblingAreas.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">
              {area.reg} 인근 지역 로또 명당
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblingAreas.map((sib) => (
                <Link
                  key={sib.slug}
                  href={`/area/${sib.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#10b981] text-sm font-bold text-slate-700"
                >
                  {sib.sig} ({sib.count}곳)
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
