import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { REGIONS, getAllStores, getAllHistory } from '@/lib/seoData';

export const metadata: Metadata = {
  title: '전국 로또 명당 TOP 20 · 당첨금 세금·수령 방법 가이드 | 로또명당',
  description:
    '전국 역대 로또 1등 최다 배출 명당 TOP 20, 최근 1년 신흥 명당 순위, 로또 당첨금 세율(22%·33%) 및 농협 수령 방법 완벽 정리.',
  keywords: [
    '전국 로또 명당 순위',
    '로또 1등 당첨금 세금',
    '로또 당첨금 수령 방법',
    '스파 로또',
    '부일카서비스',
    '최근 1년 로또 명당',
  ],
  alternates: {
    canonical: 'https://lotto.animap.co.kr/guide',
  },
};

export default function GuidePage() {
  const stores = getAllStores();
  const history = getAllHistory();
  const latestDraw = history[0];

  const offlineTop20 = stores.filter((s) => s.reg !== '온라인').slice(0, 20);
  const recent1yTop10 = [...stores]
    .filter((s) => s.reg !== '온라인' && (s.c1y || 0) > 0)
    .sort((a, b) => (b.c1y || 0) - (a.c1y || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#10b981] flex items-center justify-center text-white font-black text-lg">
              L
            </div>
            <span className="font-black text-xl text-slate-900">로또명당</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm font-extrabold"
          >
            번호 뽑기 · 지도
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            전국 로또 명당 통계 및 당첨금 수령 가이드
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            제{latestDraw?.draw_no || 1251}회({latestDraw?.date?.slice(0, 10) || '2026-11-21'}) 기준
            전국 오프라인 로또 1등 최다 배출 명당 순위와 최근 1년 신흥 명당, 그리고 당첨 시 꼭 알아야 할
            세금 및 수령 절차를 정리했습니다.
          </p>
        </section>

        {/* 최근 1년 신흥 명당 TOP 10 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            최근 1년 가장 기운이 좋은 오프라인 로또 명당 TOP 10
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recent1yTop10.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#10b981]">{idx + 1}위</span>
                    <strong className="text-base font-extrabold text-slate-900 truncate">
                      {s.name}
                    </strong>
                  </div>
                  <p className="text-sm text-slate-600 truncate mt-0.5">{s.addr}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#10b981] text-white text-xs font-extrabold shrink-0">
                  1년 {s.c1y}회
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 역대 오프라인 TOP 20 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            대한민국 역대 오프라인 로또 1등 명당 TOP 20
          </h2>
          <div className="divide-y divide-slate-100">
            {offlineTop20.map((s, idx) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-black text-slate-900 mr-2">{idx + 1}위</span>
                  <strong className="text-base font-extrabold text-slate-900">{s.name}</strong>
                  <span className="text-sm text-slate-500 ml-2">({s.reg} {s.sig})</span>
                </div>
                <span className="text-sm font-extrabold text-[#059669] shrink-0">
                  1등 {s.cnt}회
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 당첨금 세금 및 수령 방법 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            로또 당첨금 세율 및 수령 장소 안내
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <th className="p-3 font-extrabold">등수 / 금액 기준</th>
                  <th className="p-3 font-extrabold">세율 (기타소득세+지방소득세)</th>
                  <th className="p-3 font-extrabold">지급 장소</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3 font-bold">1등 (3억 원 초과분)</td>
                  <td className="p-3">33% (3억 이하 22% + 초과분 33%)</td>
                  <td className="p-3 font-semibold">NH농협은행 본점 (서울 중구)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">2등 · 3등 (200만 원 초과)</td>
                  <td className="p-3">22% (소득세 20% + 지방소득세 2%)</td>
                  <td className="p-3 font-semibold">전국 NH농협은행 각 지점</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">4등 (5만 원) · 5등 (5천 원)</td>
                  <td className="p-3">비과세 (세금 없음)</td>
                  <td className="p-3 font-semibold">전국 로또 판매점 및 농협 지점</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            * 지급 기한은 해당 회차 지급 개시일로부터 1년입니다.
          </p>
        </section>

        {/* 전국 17개 시·도 명당 허브 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-black text-slate-900 mb-3">
            전국 17개 시·도별 로또 명당 바로가기
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`/region/${r.slug}`}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#10b981] text-sm font-bold text-slate-800"
              >
                {r.name} 로또 명당
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
