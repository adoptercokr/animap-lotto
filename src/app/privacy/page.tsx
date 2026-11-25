import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import SubHeader from '@/components/SubHeader';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 로또명당',
  description: '로또명당(lotto.animap.co.kr) 개인정보처리방침입니다.',
  alternates: { canonical: 'https://lotto.animap.co.kr/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <SubHeader current="privacy" />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <h1 className="text-2xl font-black text-slate-900">개인정보처리방침</h1>
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">1. 개인정보 수집 항목</h2>
                <p>
                  로또명당은 별도의 회원가입 절차 없이 누구나 무료로 이용할 수 있으며, 이름·주민등록번호 등 민감한 개인정보를 수집하지 않습니다. 단, 문의하기 이용 시 회신을 위한 이메일 주소 또는 연락처를 이용자의 동의하에 수집합니다.
                </p>
              </section>
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">2. 위치 정보 및 로컬 저장소(LocalStorage)</h2>
                <p>
                  &apos;내 주변 명당 찾기&apos; 기능 이용 시 브라우저의 GPS 위치 정보는 현재 기기 내에서 거리 계산에만 즉시 사용되며 서버에 영구 저장되지 않습니다. 최근 생성한 로또 번호 이력은 이용자 본인의 브라우저 저장소(LocalStorage)에 보관됩니다.
                </p>
              </section>
              <section>
                <h2 className="font-extrabold text-slate-900 mb-1">3. 쿠키 및 로그</h2>
                <p>
                  서비스 품질 개선 및 접속 통계 파악을 위해 비식별 접속 로그 및 쿠키가 사용될 수 있으며, 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
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
