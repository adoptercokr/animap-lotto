'use client';

import React, { useState, useMemo } from 'react';
import { LottoDrawHistory } from '../types/lotto';
import { getBallColorClass } from '../utils/lottoGenerator';

interface LottoHistoryProps {
  historyData: LottoDrawHistory[];
}

export default function LottoHistory({ historyData }: LottoHistoryProps) {
  // 데이터에 존재하는 연도 목록 추출 (내림차순)
  const years = useMemo(() => {
    const yearSet = new Set<string>();
    historyData.forEach((d) => {
      if (d.date) yearSet.add(d.date.slice(0, 4));
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [historyData]);

  const [selectedYear, setSelectedYear] = useState<string>(years[0] || '2026');
  const latest = historyData[0];

  const filteredHistory = useMemo(() => {
    return historyData.filter((d) => d.date?.startsWith(selectedYear));
  }, [historyData, selectedYear]);

  const formatMoney = (amount: number) => {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    if (eok > 0) {
      return `${eok}억 ${man > 0 ? man.toLocaleString() + '만' : ''}원`;
    }
    return `${man.toLocaleString()}만원`;
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* 최신 회차 당첨 결과 (심플한 화이트 카드 & 큰 당첨금/당첨자수) */}
      {latest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              제 {latest.draw_no}회 당첨 결과
            </h3>
            <span className="text-sm sm:text-base text-slate-500 font-semibold">
              {latest.date.slice(0, 10)} 추첨
            </span>
          </div>

          {/* 당첨 볼 + 보너스 볼 */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 bg-slate-50 py-5 px-3 rounded-2xl mb-5 border border-slate-100 flex-wrap">
            {latest.numbers.map((num) => (
              <span
                key={num}
                className={`lotto-ball w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-black ${getBallColorClass(
                  num
                )}`}
              >
                {num}
              </span>
            ))}
            <span className="text-slate-400 font-black text-lg mx-1">+</span>
            <span
              className={`lotto-ball w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-black ring-2 ring-slate-400 ring-offset-2 ${getBallColorClass(
                latest.bonus_no
              )}`}
            >
              {latest.bonus_no}
            </span>
          </div>

          {/* 1등 당첨금 및 당첨자수 (아주 크게 강조) */}
          {latest.divisions && latest.divisions[0] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-center">
                <span className="text-sm font-bold text-slate-500 block mb-1">
                  1등 1인당 당첨금액
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatMoney(latest.divisions[0].prize)}
                </strong>
              </div>
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-center">
                <span className="text-sm font-bold text-slate-500 block mb-1">
                  1등 당첨자 수
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  총 {latest.divisions[0].winners}명
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 연도별 당첨 번호 조회 탭 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-lg font-extrabold text-slate-900">
          역대 당첨 번호 ({selectedYear}년 · {filteredHistory.length}회)
        </h4>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {years.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-colors shrink-0 ${
                selectedYear === yr
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {yr}년
            </button>
          ))}
        </div>
      </div>

      {/* 해당 연도 회차 리스트 */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {filteredHistory.map((draw) => (
          <div
            key={draw.draw_no}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black text-slate-900">
                {draw.draw_no}회
              </span>
              <span className="text-sm text-slate-500 font-medium">
                {draw.date.slice(0, 10)}
              </span>
              {draw.divisions?.[0] && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  1등 {draw.divisions[0].winners}명
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {draw.numbers.map((num) => (
                <span
                  key={num}
                  className={`lotto-ball w-8 h-8 text-sm font-black ${getBallColorClass(num)}`}
                >
                  {num}
                </span>
              ))}
              <span className="text-slate-400 font-bold text-sm mx-0.5">+</span>
              <span
                className={`lotto-ball w-8 h-8 text-sm font-black ring-1 ring-slate-300 ${getBallColorClass(
                  draw.bonus_no
                )}`}
              >
                {draw.bonus_no}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
