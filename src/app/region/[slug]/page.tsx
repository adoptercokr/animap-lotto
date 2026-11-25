import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SubHeader from '@/components/SubHeader';
import { REGIONS, AREAS, getAllStores } from '@/lib/seoData';

export const dynamicParams = false;

export function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const region = REGIONS.find((r) => r.slug === slug);
  if (!region) return {};

  const stores = getAllStores().filter((s) => s.reg.includes(region.name));
  const topStore = stores[0];
  const title = `${region.name} 로또 명당 순위 TOP 20 · 1등 배출 판매점 지도 | 로또명당`;
  const description = `${region.fullName} 로또 1등 배출 판매점 ${stores.length}곳 총정리. 1위 ${
    topStore ? `${topStore.name}(1등 ${topStore.cnt}회)` : ''
  } 포함 누적 명당과 최근 1년 신흥 명당, 지도 위치를 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${region.name} 로또 명당`,
      `${region.name} 로또 1등 판매점`,
      `${region.fullName} 로또 명당`,
      `${region.name} 최근 1년 로또 명당`,
      '로또명당',
      '로또명당지도',
    ],
    alternates: {
      canonical: `https://lotto.animap.co.kr/region/${region.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://lotto.animap.co.kr/region/${region.slug}`,
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = REGIONS.find((r) => r.slug === slug);
  if (!region) notFound();

  const regionStores = getAllStores()
    .filter((s) => s.reg.includes(region.name))
    .sort((a, b) => b.cnt - a.cnt);

  const total1stWins = regionStores.reduce((acc, s) => acc + s.cnt, 0);
  const recent1yStores = [...regionStores]
    .filter((s) => (s.c1y || 0) > 0)
    .sort((a, b) => (b.c1y || 0) - (a.c1y || 0))
    .slice(0, 10);

  const childAreas = AREAS.filter((a) => a.regSlug === region.slug);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${region.name}에서 로또 1등이 가장 많이 나온 명당은 어디인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: regionStores[0]
            ? `${region.fullName} 최다 1등 배출 명당은 ${regionStores[0].addr}에 위치한 '${regionStores[0].name}'으로 총 ${regionStores[0].cnt}회 1등을 배출했습니다.`
            : `${region.fullName} 로또 명당 정보를 확인하세요.`,
        },
      },
      {
        '@type': 'Question',
        name: `${region.name} 지역의 최근 1년 신흥 로또 명당은 어디인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: recent1yStores[0]
            ? `최근 1년 기준 ${region.name}에서 가장 기운이 좋은 판매점은 '${recent1yStores[0].name}'(최근 1년 ${recent1yStores[0].c1y}회 1등 배출)입니다.`
            : `로또명당 지도에서 최근 1년 필터로 확인하실 수 있습니다.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* 상단 공용 헤더 (4대 메인 메뉴 유지) */}
      <SubHeader current="region" />

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* 지역 요약 히어로 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-[#10b981] mb-1">{region.fullName} 로또 명당 분석</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            {region.name} 로또 1등 명당 순위 및 판매점 안내
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mb-5">
            {region.fullName} 지역에서는 지금까지 총 <strong>{regionStores.length.toLocaleString()}곳</strong>의
            판매점에서 누적 <strong>{total1stWins.toLocaleString()}회</strong>의 로또 1등이 배출되었습니다.
            {regionStores[0] && (
              <>
                {' '}현재 {region.name} 역대 1위는{' '}
                <strong>
                  {regionStores[0].name} ({regionStores[0].sig} · 1등 {regionStores[0].cnt}회)
                </strong>
                입니다.
              </>
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">1등 배출 판매점</span>
              <strong className="text-xl font-black text-slate-900">
                {regionStores.length.toLocaleString()}곳
              </strong>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">누적 1등 배출</span>
              <strong className="text-xl font-black text-[#10b981]">
                {total1stWins.toLocaleString()}회
              </strong>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-slate-500 block">지역 1위 명당</span>
              <strong className="text-lg font-black text-slate-900 truncate block">
                {regionStores[0]?.name || '-'}
              </strong>
            </div>
          </div>
        </section>

        {/* 세부 시·군·구 바로가기 (내부 링크 망) */}
        {childAreas.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-black text-slate-900 mb-3">
              {region.name} 시·군·구별 로또 명당 찾기
            </h2>
            <div className="flex flex-wrap gap-2">
              {childAreas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/area/${area.slug}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10b981] text-sm font-bold text-slate-800 transition-colors"
                >
                  {area.sig} ({area.count}곳)
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 최근 1년 신흥 명당 TOP 10 */}
        {recent1yStores.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {region.name} 최근 1년 신흥 로또 명당 TOP {recent1yStores.length}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recent1yStores.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#10b981]">{idx + 1}위</span>
                      <span className="font-extrabold text-base text-slate-900 truncate">
                        {s.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">{s.addr}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#10b981] text-white text-xs font-extrabold shrink-0">
                    최근 1년 {s.c1y}회
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 누적 명당 TOP 20 리스트 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            {region.name} 역대 1등 최다 배출 명당 TOP 20
          </h2>
          <div className="divide-y divide-slate-100">
            {regionStores.slice(0, 20).map((s, idx) => (
              <div
                key={s.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <strong className="text-base font-extrabold text-slate-900">{s.name}</strong>
                    <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full">
                      1등 {s.cnt}회
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{s.addr}</p>
                </div>
                <div className="text-sm text-slate-500 font-semibold shrink-0">
                  자동 {s.auto}회 · 수동 {s.cnt - s.auto}회
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 다른 시·도 둘러보기 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-3">
            전국 다른 지역 로또 명당 보기
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`/region/${r.slug}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                  r.slug === region.slug
                    ? 'bg-[#10b981] text-white border-[#10b981]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
