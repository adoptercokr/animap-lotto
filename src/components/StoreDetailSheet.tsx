'use client';

import React from 'react';
import { LottoStore } from '../types/lotto';
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react';

interface StoreDetailSheetProps {
  store: LottoStore | null;
  onClose: () => void;
  onGenerateWithStore: (store: LottoStore) => void;
}

export default function StoreDetailSheet({
  store,
  onClose,
  onGenerateWithStore,
}: StoreDetailSheetProps) {
  if (!store) return null;

  const totalCount = store.cnt || 1;
  const autoPct = Math.round((store.auto / totalCount) * 100);
  const manPct = Math.max(0, 100 - autoPct);

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;
  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(store.addr + ' ' + store.name)}`;

  return (
    <div className="fixed inset-x-0 bottom-0 md:left-4 md:bottom-4 md:right-auto md:w-[380px] z-50">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* 모바일 드래그 핸들 */}
        <div className="w-full flex justify-center pt-2.5 pb-1 md:hidden" onClick={onClose}>
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        <div className="p-5">
          {/* 상단 등급/배출 뱃지 + 닫기 */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#10b981] text-white text-xs font-extrabold">
                1등 {store.cnt}회 배출
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {store.grd}
              </span>
              {store.distance !== undefined && (
                <span className="text-xs font-semibold text-slate-500">
                  {store.distance < 1
                    ? `${Math.round(store.distance * 1000)}m`
                    : `${store.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="닫기"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* 상호 & 주소 */}
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
            {store.name}
          </h3>
          <p className="text-sm text-slate-600 flex items-start gap-1.5 mb-4">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{store.addr}</span>
          </p>

          {/* 총 1등 배출 / 자동 / 수동 3칸 명확 표시 */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-white rounded-lg py-2 px-1 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">총 1등 배출</span>
                <strong className="text-base sm:text-lg font-black text-slate-900">{store.cnt}회</strong>
              </div>
              <div className="bg-white rounded-lg py-2 px-1 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">자동</span>
                <strong className="text-base sm:text-lg font-black text-[#10b981]">{store.auto}회</strong>
              </div>
              <div className="bg-white rounded-lg py-2 px-1 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">수동·반자동</span>
                <strong className="text-base sm:text-lg font-black text-slate-700">{store.cnt - store.auto}회</strong>
              </div>
            </div>

            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-700">자동 {autoPct}%</span>
              <span className="text-slate-500">수동·반자동 {manPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-[#10b981] h-full"
                style={{ width: `${autoPct}%` }}
              />
            </div>
            {store.rec && store.rec.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">최근 1등 회차</span>
                <div className="flex gap-1.5">
                  {store.rec.map((drw, idx) => (
                    <span
                      key={`${drw}-${idx}`}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-bold"
                    >
                      {drw}회
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 이 명당 기운으로 번호 받기 (메인 컬러 통일) */}
          <button
            onClick={() => onGenerateWithStore(store)}
            className="w-full py-3.5 px-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-extrabold text-sm sm:text-base transition-colors mb-2.5"
          >
            이 명당 기운으로 번호 받기
          </button>

          {/* 카카오 노란색 / 네이버 그린 길찾기 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" strokeWidth={2} />
              <span>카카오맵 길찾기</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href={naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 bg-[#03C75A] hover:bg-[#02b350] text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
              <span>네이버지도 보기</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
