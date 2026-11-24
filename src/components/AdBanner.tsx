'use client';

import React from 'react';

interface AdBannerProps {
  variant: 'top' | 'native' | 'modal';
  className?: string;
}

export default function AdBanner({ variant, className = '' }: AdBannerProps) {
  if (variant === 'top') {
    return (
      <div
        className={`w-full bg-slate-50 border-b border-slate-200 flex items-center justify-center py-2 px-4 text-xs text-slate-500 ${className}`}
      >
        <div className="max-w-3xl w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold shrink-0">
              AD
            </span>
            <span className="font-medium text-slate-700 truncate">
              오늘의 띠별 재물운 &amp; 나에게 맞는 비상금 한도 조회하기
            </span>
          </div>
          <span className="text-emerald-600 font-bold text-[11px] shrink-0 ml-2">
            자세히 보기 &rarr;
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'native') {
    return (
      <div
        className={`my-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.5 bg-slate-200/80 text-slate-600 rounded text-[10px] font-bold">
              스폰서
            </span>
            <span className="text-[11px] font-semibold text-amber-600">
              이번 주 로또 행운 지수 UP
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate">
            2026년 나의 대박 터지는 달과 사주 운세 무료 확인
          </p>
        </div>
        <div className="px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg shrink-0">
          확인
        </div>
      </div>
    );
  }

  // modal / generator bottom
  return (
    <div
      className={`w-full p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="min-w-0">
        <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold mb-1">
          AD · 추천 금융/운세
        </span>
        <p className="text-xs font-bold text-slate-800 truncate">
          직장인 1금융권 최저금리 비교 &amp; 내 신용점수 올리기
        </p>
      </div>
      <span className="px-3 py-1.5 bg-amber-500 text-white text-[11px] font-bold rounded-lg shrink-0">
        보기
      </span>
    </div>
  );
}
