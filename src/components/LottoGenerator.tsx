'use client';

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { LottoStore, LottoDrawHistory } from '../types/lotto';
import { generateSingleGame, generateLottoSet, getBallColorClass } from '../utils/lottoGenerator';
import {
  Download,
  RefreshCw,
  History,
  Trash2,
  CheckCircle2,
  MapPin,
  Edit3,
} from 'lucide-react';

interface LottoGeneratorProps {
  stores: LottoStore[];
  historyData: LottoDrawHistory[];
  linkedStore: LottoStore | null;
  onSelectLinkedStore: (store: LottoStore | null) => void;
}

interface SavedTicket {
  id: string;
  date: string;
  mode: string;
  games: number[][];
}

export default function LottoGenerator({
  stores,
  historyData,
  linkedStore,
  onSelectLinkedStore,
}: LottoGeneratorProps) {
  // 5게임 (각 게임은 0~6개 숫자 배열)
  const [games, setGames] = useState<number[][]>([[], [], [], [], []]);
  const [gameTypes, setGameTypes] = useState<string[]>(['자동', '자동', '자동', '자동', '자동']);
  const [activeMode, setActiveMode] = useState<'stats' | 'pattern' | 'store' | 'manual'>(
    linkedStore ? 'store' : 'stats'
  );
  const [activeRow, setActiveRow] = useState<number>(0); // 직접 찍을 때 선택된 줄 (0~4 = A~E)
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);
  const rowLabels = ['A', 'B', 'C', 'D', 'E'];
  const latestDrawNo = historyData[0]?.draw_no ? historyData[0].draw_no + 1 : 1252;
  const topStores = stores.slice(0, 30);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('animap_lotto_history');
      if (raw) setSavedTickets(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // 초기 로딩 또는 명당 선택 시 번호 생성
  useEffect(() => {
    if (linkedStore) {
      setActiveMode('store');
      handleGenerateAll('store', linkedStore);
    } else if (games[0].length === 0) {
      handleGenerateAll('stats', null);
    }
  }, [linkedStore]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const saveHistoryAndServer = (newGames: number[][], label: string, storeObj: LottoStore | null) => {
    const newTicket: SavedTicket = {
      id: String(Date.now()),
      date: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      mode: label,
      games: newGames,
    };

    const updated = [newTicket, ...savedTickets].slice(0, 8);
    setSavedTickets(updated);
    try {
      localStorage.setItem('animap_lotto_history', JSON.stringify(updated));
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawNo: latestDrawNo,
          games: newGames,
          mode: label,
          storeName: storeObj?.name,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  // 전체 5게임 새로 뽑기
  const handleGenerateAll = (
    mode: 'stats' | 'pattern' | 'store',
    targetStore: LottoStore | null = linkedStore
  ) => {
    setActiveMode(mode);
    const engineMode = mode === 'stats' ? 'ai' : mode === 'pattern' ? 'pattern' : 'store';
    const newGames = generateLottoSet(
      engineMode,
      historyData,
      targetStore?.name,
      targetStore?.cnt || 1
    );
    setGames(newGames);
    setGameTypes(['자동', '자동', '자동', '자동', '자동']);

    const label =
      mode === 'store' && targetStore
        ? `${targetStore.name} 기운`
        : mode === 'stats'
        ? '통계 추천'
        : '1등 패턴';
    saveHistoryAndServer(newGames, label, targetStore);
  };

  // 직접 찍기 모드에서 특정 줄에 숫자 클릭
  const handlePickNumberForRow = (num: number) => {
    setGames((prev) => {
      const copy = prev.map((row) => [...row]);
      const current = copy[activeRow];
      if (current.includes(num)) {
        copy[activeRow] = current.filter((n) => n !== num);
      } else {
        if (current.length >= 6) {
          showToast(`${rowLabels[activeRow]}조는 이미 6개를 모두 선택했습니다.`);
          return prev;
        }
        copy[activeRow] = [...current, num].sort((a, b) => a - b);
      }

      // 6개 꽉 찼으면 수동, 1~5개면 반자동 표시
      setGameTypes((tPrev) => {
        const tCopy = [...tPrev];
        const len = copy[activeRow].length;
        tCopy[activeRow] = len === 6 ? '수동' : len > 0 ? '직접선택' : '비어있음';
        return tCopy;
      });
      return copy;
    });
  };

  // 직접 찍기: 현재 줄 비우기 또는 전체 비우기
  const handleClearManual = (onlyCurrentRow: boolean) => {
    if (onlyCurrentRow) {
      setGames((prev) => {
        const copy = prev.map((r) => [...r]);
        copy[activeRow] = [];
        return copy;
      });
      setGameTypes((prev) => {
        const copy = [...prev];
        copy[activeRow] = '비어있음';
        return copy;
      });
    } else {
      setGames([[], [], [], [], []]);
      setGameTypes(['비어있음', '비어있음', '비어있음', '비어있음', '비어있음']);
      setActiveRow(0);
    }
  };

  // 내가 찍은 번호는 유지하고 나머지 빈 칸만 자동 또는 명당 기운으로 채우기!
  const handleFillRemainder = (fillType: 'auto' | 'store') => {
    if (fillType === 'store' && !linkedStore) {
      showToast('위에서 먼저 기운을 받을 명당을 선택해 주세요.');
      return;
    }

    const newGames: number[][] = [];
    const newTypes: string[] = [];

    for (let i = 0; i < 5; i++) {
      const manualPicks = games[i];
      if (manualPicks.length === 6) {
        newGames.push([...manualPicks]);
        newTypes.push('수동');
      } else {
        const filled = generateSingleGame(
          fillType === 'store' ? 'store' : 'ai',
          historyData,
          fillType === 'store' && linkedStore ? `${linkedStore.name}_${i}` : undefined,
          linkedStore?.cnt || 1,
          manualPicks,
          []
        );
        newGames.push(filled);
        newTypes.push(manualPicks.length > 0 ? '반자동' : fillType === 'store' ? '명당자동' : '자동');
      }
    }

    setGames(newGames);
    setGameTypes(newTypes);

    const label =
      fillType === 'store' && linkedStore
        ? `${linkedStore.name} 나머지 채우기`
        : '직접선택 + 나머지 자동';
    saveHistoryAndServer(newGames, label, linkedStore);
    showToast(
      fillType === 'store' && linkedStore
        ? `빈 칸을 [${linkedStore.name}] 기운으로 채웠습니다.`
        : '빈 칸을 자동으로 모두 채웠습니다.'
    );
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || isDownloading) return;
    if (games.some((g) => g.length < 6)) {
      showToast('5게임(30개 번호)을 모두 채운 뒤 저장해 주세요.');
      return;
    }
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `lotto_${dateStr}.png`;
      link.href = url;
      link.click();
      showToast('사진이 저장되었습니다.');
    } catch {
      showToast('사진 저장에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const clearHistory = () => {
    setSavedTickets([]);
    localStorage.removeItem('animap_lotto_history');
    showToast('기록을 비웠습니다.');
  };

  // 번호별 테두리/글씨 색상 (미선택 시 원형 로또볼 테두리용)
  const getUnpickedBallStyle = (num: number) => {
    if (num <= 10) return 'border-yellow-500 text-yellow-700 bg-white hover:bg-yellow-50';
    if (num <= 20) return 'border-blue-500 text-blue-700 bg-white hover:bg-blue-50';
    if (num <= 30) return 'border-red-500 text-red-700 bg-white hover:bg-red-50';
    if (num <= 40) return 'border-slate-500 text-slate-700 bg-white hover:bg-slate-50';
    return 'border-green-600 text-green-700 bg-white hover:bg-green-50';
  };

  return (
    <div className="flex flex-col gap-4 pb-10">
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 기운 받을 명당 직접 고르기 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <label className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mb-2">
          <MapPin className="w-4 h-4 text-slate-600" />
          <span>어느 명당의 기운을 받을까요?</span>
        </label>
        <select
          value={linkedStore?.id || ''}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              onSelectLinkedStore(null);
            } else {
              const found = stores.find((s) => s.id === val) || null;
              onSelectLinkedStore(found);
            }
          }}
          className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">선택 안 함 (전국 일반 통계 기준)</option>
          {topStores.map((s, idx) => (
            <option key={s.id} value={s.id}>
              {idx + 1}위. {s.name} ({s.reg} {s.sig} · 1등 {s.cnt}회)
            </option>
          ))}
        </select>
      </div>

      {/* 2. 4가지 방식 선택 버튼 (메인 컬러 #10b981 통일) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => handleGenerateAll('stats', linkedStore)}
          className={`py-3.5 px-3 rounded-xl text-sm sm:text-base font-extrabold border transition-all ${
            activeMode === 'stats'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          통계 추천
        </button>

        <button
          onClick={() => handleGenerateAll('pattern', linkedStore)}
          className={`py-3.5 px-3 rounded-xl text-sm sm:text-base font-extrabold border transition-all ${
            activeMode === 'pattern'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          1등 패턴
        </button>

        <button
          onClick={() => {
            if (!linkedStore) {
              const top1 = topStores[1] || topStores[0];
              if (top1) {
                onSelectLinkedStore(top1);
                handleGenerateAll('store', top1);
                showToast(`[${top1.name}] 기운으로 번호를 뽑았습니다.`);
              }
            } else {
              handleGenerateAll('store', linkedStore);
            }
          }}
          className={`py-3.5 px-3 rounded-xl text-sm sm:text-base font-extrabold border transition-all ${
            activeMode === 'store'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          명당 기운
        </button>

        <button
          onClick={() => {
            setActiveMode('manual');
            handleClearManual(false);
          }}
          className={`py-3.5 px-3 rounded-xl text-sm sm:text-base font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'manual'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>직접 찍기</span>
        </button>
      </div>

      {/* 3. 직접 찍기 원형 로또 볼 번호판 */}
      {activeMode === 'manual' && (
        <div className="bg-white rounded-2xl border-2 border-[#10b981] p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-base font-extrabold text-slate-900">
              {rowLabels[activeRow]}조 번호 선택 ({games[activeRow]?.length || 0}/6개)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleClearManual(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-200"
              >
                {rowLabels[activeRow]}조 비우기
              </button>
              <button
                onClick={() => handleClearManual(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-200"
              >
                전체 비우기
              </button>
            </div>
          </div>

          {/* A~E 조 선택 탭 */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {rowLabels.map((lbl, idx) => (
              <button
                key={lbl}
                onClick={() => setActiveRow(idx)}
                className={`py-2 rounded-xl text-sm font-extrabold border transition-all ${
                  activeRow === idx
                    ? 'bg-[#10b981] text-white border-[#10b981]'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {lbl}조 ({games[idx]?.length || 0})
              </button>
            ))}
          </div>

          {/* 1~45 원형 로또 볼 숫자판 */}
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 justify-items-center mb-5">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const isPicked = games[activeRow]?.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handlePickNumberForRow(num)}
                  className={`w-10 h-10 rounded-full text-sm sm:text-base font-black transition-all flex items-center justify-center ${
                    isPicked
                      ? `lotto-ball ${getBallColorClass(num)} scale-110`
                      : `border-2 ${getUnpickedBallStyle(num)}`
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* 심플해진 나머지 채우기 버튼 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handleFillRemainder('auto')}
              className="py-3.5 px-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-base font-extrabold transition-colors"
            >
              나머지 자동 채우기
            </button>
            <button
              onClick={() => handleFillRemainder('store')}
              className="py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-base font-extrabold transition-colors"
            >
              나머지 명당 채우기
            </button>
          </div>
        </div>
      )}

      {/* 4. 캡처용 로또 영수증 티켓 */}
      <div ref={ticketRef} className="receipt-paper receipt-sawtooth rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="text-center border-b-2 border-dashed border-slate-200 pb-4 mb-4">
          <p className="text-sm font-extrabold text-emerald-700 tracking-wider uppercase mb-1">
            로또 6/45 제 {latestDrawNo}회
          </p>
          <h4 className="text-2xl font-black text-slate-900">이번 주 행운 번호</h4>
          <p className="text-sm text-slate-600 font-semibold mt-1">
            {linkedStore
              ? `${linkedStore.name} (1등 ${linkedStore.cnt}회 배출 명당)`
              : activeMode === 'manual'
              ? '직접 마킹 · 반자동 용지'
              : activeMode === 'pattern'
              ? '역대 1등 번호대 분산 조합'
              : '최근 50회차 당첨 통계 기반'}
          </p>
        </div>

        <div className="space-y-3.5 my-2">
          {games.map((nums, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (activeMode === 'manual') setActiveRow(idx);
              }}
              className={`flex items-center justify-between py-2 px-2 rounded-xl border-b border-slate-100 last:border-none ${
                activeMode === 'manual' && activeRow === idx ? 'bg-blue-50/70' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-base font-black text-slate-700">{rowLabels[idx]}</span>
                <span className="text-xs sm:text-sm font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {gameTypes[idx] || '자동'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {nums.length === 0 ? (
                  <span className="text-sm text-slate-400 font-medium">번호를 선택하세요</span>
                ) : (
                  nums.map((n) => (
                    <span
                      key={n}
                      className={`lotto-ball w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base font-black ${getBallColorClass(
                        n
                      )}`}
                    >
                      {n}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between text-sm text-slate-500 font-medium">
          <span>발행: {new Date().toLocaleDateString('ko-KR')}</span>
          <span className="font-bold text-slate-700">lotto.animap.co.kr</span>
        </div>
      </div>

      {/* 5. 메인 액션 버튼 */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <button
          onClick={() =>
            activeMode === 'manual'
              ? handleFillRemainder(linkedStore ? 'store' : 'auto')
              : handleGenerateAll(activeMode === 'pattern' ? 'pattern' : activeMode === 'store' ? 'store' : 'stats', linkedStore)
          }
          className="py-4 px-4 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span>{activeMode === 'manual' ? '나머지 채우기' : '새 번호 뽑기'}</span>
        </button>

        <button
          onClick={handleDownloadTicket}
          disabled={isDownloading}
          className="py-4 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>{isDownloading ? '저장 중...' : '사진으로 저장'}</span>
        </button>
      </div>

      {/* 최근 생성 이력 */}
      {savedTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mt-1">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>최근 뽑은 번호</span>
            </h5>
            <button
              onClick={clearHistory}
              className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1 font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span>비우기</span>
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {savedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-emerald-700">{ticket.mode}</span>
                  <span className="text-xs sm:text-sm text-slate-500">{ticket.date}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ticket.games[0]?.map((n) => (
                    <span
                      key={n}
                      className={`lotto-ball w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-bold ${getBallColorClass(
                        n
                      )}`}
                    >
                      {n}
                    </span>
                  ))}
                  <span className="text-sm text-slate-500 ml-1">외 4게임</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
