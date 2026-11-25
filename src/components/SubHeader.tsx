import React from 'react';
import Link from 'next/link';
import { Ticket, Trophy, Map as MapIcon, History } from 'lucide-react';

interface SubHeaderProps {
  current?: 'guide' | 'terms' | 'privacy' | 'region' | 'area';
}

export default function SubHeader({ current }: SubHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shrink-0 z-30">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#10b981] flex items-center justify-center text-white font-black text-base sm:text-xl">
            L
          </div>
          <span className="font-black text-slate-900 text-base sm:text-2xl tracking-tight">
            로또명당
          </span>
        </Link>

        {/* 4대 메인 탭 (모바일 1줄 + 가로 스크롤) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar min-w-0">
          <Link
            href="/?tab=generator"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
            <span>번호뽑기</span>
          </Link>

          <Link
            href="/?tab=ranking"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
            <span>명당순위</span>
          </Link>

          <Link
            href="/?tab=map"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
            <span>명당지도</span>
          </Link>

          <Link
            href="/?tab=history"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
            <span>당첨번호</span>
          </Link>
        </nav>

        {/* PC 가이드/홈 버튼 */}
        <Link
          href="/guide"
          className={`hidden md:flex px-3 py-2 rounded-xl border text-sm font-bold items-center shrink-0 transition-colors ${
            current === 'guide'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          당첨가이드
        </Link>
      </div>
    </header>
  );
}
