import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SubHeader from '@/components/SubHeader';
import { REGIONS, getAllStores, getAllHistory } from '@/lib/seoData';

export const metadata: Metadata = {
  title: '로또 당첨 가이드 · 1등 실수령액 계산표 · 수령 방법 · 명당 TOP 20 | 로또명당',
  description:
    '로또 1등 당첨금 10억~50억 실수령액 계산표, 세율(22%·33%), 농협 수령 준비물, 주의사항, 최근 1년 신흥 명당 및 역대 명당 TOP 20 총정리.',
  keywords: [
    '로또 당첨금 실수령액',
    '로또 1등 세금 계산',
    '로또 당첨금 수령 방법',
    '로또 농협 본점 준비물',
    '전국 로또 명당 순위',
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

  // 1등 실수령액 예시 (3억 이하 22%, 3억 초과 33% 과세, 구매금액 1천원 공제 기준)
  const prizeExamples = [
    { total: '10억 원', tax: '2억 9,700만 원', net: '7억 300만 원' },
    { total: '15억 원', tax: '4억 6,200만 원', net: '10억 3,800만 원' },
    { total: '20억 원', tax: '6억 2,700만 원', net: '13억 7,300만 원' },
    { total: '30억 원', tax: '9억 5,700만 원', net: '20억 4,300만 원' },
    { total: '50억 원', tax: '16억 1,700만 원', net: '33억 8,300만 원' },
  ];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '로또 1등 20억 원 당첨 시 실제 통장에 들어오는 실수령액은 얼마인가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '당첨금 3억 원 이하 구간에는 22%, 3억 원 초과 구간에는 33% 세율이 적용됩니다. 20억 원 당첨 시 세금 약 6억 2,700만 원을 제외한 약 13억 7,300만 원을 수령하게 됩니다.',
        },
      },
      {
        '@type': 'Question',
        name: '로또 당첨금은 언제까지, 어디서 수령해야 하나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '지급 개시일로부터 1년 이내에 수령해야 합니다. 1등은 서울 중구 NH농협은행 본점, 2·3등은 전국 NH농협은행 각 지점, 4·5등은 일반 로또 판매점에서 수령할 수 있습니다.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div>
        <SubHeader current="guide" />

        <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-7">
          {/* 인트로 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
              로또 당첨 가이드 · 세금 실수령액 및 명당 통계
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              제{latestDraw?.draw_no || 1251}회({latestDraw?.date?.slice(0, 10) || '2026-11-21'}) 기준
              전국 로또 1등 명당 데이터와 함께, 당첨 시 꼭 알아야 할{' '}
              <strong>실수령액 계산표, 농협 수령 준비물, 주의사항</strong>을 한눈에 정리했습니다.
            </p>
          </section>

          {/* 1. 1등 당첨금 실수령액 계산표 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-2">
              1등 당첨금 구간별 실수령액 표 (세후)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              3억 원 이하 22%(기타소득세 20%+지방소득세 2%), 3억 원 초과분 33%(기타소득세 30%+지방소득세 3%) 세율 적용 기준입니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                    <th className="p-3.5 font-extrabold">당첨 총액 (세전)</th>
                    <th className="p-3.5 font-extrabold">예상 세금</th>
                    <th className="p-3.5 font-extrabold text-[#059669]">실제 수령액 (세후)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {prizeExamples.map((row) => (
                    <tr key={row.total} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold">{row.total}</td>
                      <td className="p-3.5 text-slate-600">{row.tax}</td>
                      <td className="p-3.5 font-black text-[#059669]">{row.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. 등수별 수령 방법 & 필수 준비물 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              당첨금 수령 장소 및 필수 준비물 안내
            </h2>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                    <th className="p-3 font-extrabold">등수 (당첨 기준)</th>
                    <th className="p-3 font-extrabold">세율</th>
                    <th className="p-3 font-extrabold">지급 장소</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-bold">1등 (6개 번호 일치)</td>
                    <td className="p-3">3억 초과분 33%</td>
                    <td className="p-3 font-semibold">NH농협은행 본점 (서울 중구)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">2등 (5개 + 보너스) · 3등 (5개)</td>
                    <td className="p-3">200만 원 초과 시 22%</td>
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

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm text-slate-700">
              <p className="font-extrabold text-slate-900">1·2·3등 농협 방문 시 필수 준비물 및 주의사항</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>당첨 복권 원본</strong> (훼손·분실 시 지급 불가, 뒷면 서명란에 성명·주민번호 기재 권장)</li>
                <li><strong>본인 신분증</strong> (주민등록증, 운전면허증 또는 여권)</li>
                <li><strong>지급 기한</strong>: 추첨일 다음 영업일부터 <strong>1년 이내</strong> 수령 필수 (기한 경과 시 복권기금 귀속)</li>
                <li><strong>연령 제한</strong>: 만 19세 미만 청소년은 복권 구매 및 당첨금 수령이 불가합니다.</li>
              </ul>
            </div>
          </section>

          {/* 3. 최근 1년 신흥 명당 TOP 10 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              최근 1년 기운이 가장 좋은 로또 명당 TOP 10
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

          {/* 4. 역대 오프라인 TOP 20 */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              역대 오프라인 로또 1등 최다 배출 명당 TOP 20
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

          {/* 5. 자주 묻는 질문 FAQ */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-xl font-black text-slate-900">자주 묻는 질문 (FAQ)</h2>
            <div className="space-y-3 text-sm sm:text-base text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-extrabold text-slate-900 mb-1">
                  Q. 명당에서 구매하면 당첨 확률이 실제로 올라가나요?
                </p>
                <p>
                  모든 판매점의 1장당 당첨 확률(1/8,145,060)은 수학적으로 동일합니다. 다만 판매량이 압도적으로 많은 명당일수록 당첨자가 자주 배출되는 경향이 있으며, 반자동·수동 조합과 함께 참고용으로 활용하시는 것을 권장합니다.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-extrabold text-slate-900 mb-1">
                  Q. 로또 2등·3등은 왜 농협 본점이 아니라 지점에서 받나요?
                </p>
                <p>
                  1등 당첨금만 서울 중구 NH농협은행 본점에서 전담 지급하며, 2등과 3등 당첨금은 전국 모든 NH농협은행 지점(지역 농·축협 제외)에서 수령 가능합니다.
                </p>
              </div>
            </div>
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

      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© 로또명당 (lotto.animap.co.kr)</span>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/guide" className="hover:text-slate-900">당첨가이드</Link>
            <Link href="/terms" className="hover:text-slate-900">이용약관</Link>
            <Link href="/privacy" className="hover:text-slate-900">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
