import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SubHeader from '@/components/SubHeader';

export const metadata: Metadata = {
  title: '이용약관 및 이용안내 | 로또명당',
  description: '로또명당(lotto.animap.co.kr) 서비스 이용약관 및 안내사항입니다.',
  alternates: { canonical: 'https://lotto.animap.co.kr/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <SubHeader current="terms" />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <h1 className="text-2xl font-black text-slate-900">서비스 이용약관 및 이용안내</h1>
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">1. 서비스 목적 및 성격</h2>
                <p>
                  로또명당(lotto.animap.co.kr)은 동행복권 로또 6/45의 공개 통계 데이터를 바탕으로 전국 1등 배출 판매점 정보, 지도 검색, 번호 생성 보조 도구를 무료로 제공하는 정보 서비스입니다. 본 사이트는 복권 판매나 구매 대행을 수행하지 않습니다.
                </p>
              </section>
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">2. 정보의 정확성 및 책임 한계</h2>
                <p>
                  본 서비스가 제공하는 번호 조합은 과거 통계 및 무작위 연산에 기반한 참고용 정보이며, 실제 당첨을 보장하지 않습니다. 판매점 폐업, 이전 등에 따라 실제 위치와 일부 차이가 있을 수 있으므로 방문 전 지도 길찾기를 통해 확인하시기 바랍니다.
                </p>
              </section>
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">3. 건전한 복권 이용 안내</h2>
                <p>
                  복권 및 복권기금법에 따라 만 19세 미만 청소년은 복권을 구매할 수 없습니다. 과도한 몰입을 피하고 소액으로 건전하게 즐기시기 바랍니다.
                </p>
              </section>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <Link href="/" className="text-sm font-bold text-[#10b981] hover:underline">
                &larr; 로또명당 홈으로 돌아가기
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
