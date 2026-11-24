'use client';

import React, { useState, useEffect } from 'react';

interface WinningAlert {
  id: string;
  draw_no: number;
  rank: number;
  region: string;
  store_name?: string;
}

interface WinningTickerProps {
  latestDrawNo?: number;
  latestPrize?: number;
  totalStoresCount?: number;
}

export default function WinningTicker({
  latestDrawNo = 1251,
  latestPrize = 2068843286,
  totalStoresCount = 4735,
}: WinningTickerProps) {
  const [alerts, setAlerts] = useState<WinningAlert[]>([]);
  const [totalGamesCount, setTotalGamesCount] = useState<number>(0);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch('/api/tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.alerts?.length) setAlerts(data.alerts);
        if (data.totalGamesCount > 0) setTotalGamesCount(data.totalGamesCount);
      })
      .catch(() => {});
  }, []);

  const hasRealAlerts = alerts.length > 0;
  const prizeEok = (latestPrize / 100000000).toFixed(1);

  const factMessages = [
    `제${latestDrawNo}회 1등 당첨금 약 ${prizeEok}억 원 · 매주 토요일 밤 자동 업데이트`,
    `전국 1등 배출 판매점 ${totalStoresCount.toLocaleString()}곳 정보 제공`,
    totalGamesCount > 0
      ? `지금까지 누적 ${totalGamesCount.toLocaleString()}게임 번호가 발행되었습니다`
      : `생성한 번호는 매주 토요일 추첨 후 당첨 여부를 자동 확인합니다`,
  ];

  useEffect(() => {
    const len = hasRealAlerts ? alerts.length : factMessages.length;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % len);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasRealAlerts, alerts.length, factMessages.length]);

  return (
    <div className="w-full bg-slate-100 text-slate-700 py-2 border-b border-slate-200 shrink-0">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-3 text-sm">
        {hasRealAlerts ? (
          <p className="truncate font-semibold text-slate-800">
            <span className="text-emerald-700 font-bold mr-1.5">
              [제{alerts[idx % alerts.length].draw_no}회 당첨 소식]
            </span>
            {alerts[idx % alerts.length].region} 이용자 ·{' '}
            <strong className="text-slate-900">{alerts[idx % alerts.length].rank}등 당첨</strong>
            {alerts[idx % alerts.length].store_name && ` (${alerts[idx % alerts.length].store_name})`}
          </p>
        ) : (
          <p className="truncate font-medium text-slate-700">
            {factMessages[idx % factMessages.length]}
          </p>
        )}
      </div>
    </div>
  );
}
