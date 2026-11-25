'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { LottoStore, LottoDrawHistory, ActiveTab, StoreGrade, PeriodFilter } from '../types/lotto';
import LottoGenerator from '../components/LottoGenerator';
import LottoHistory from '../components/LottoHistory';
import StoreDetailSheet from '../components/StoreDetailSheet';
import WinningTicker from '../components/WinningTicker';
import { getBallColorClass } from '../utils/lottoGenerator';
import {
  Trophy,
  Map as MapIcon,
  History,
  Search,
  MapPin,
  Award,
  Crosshair,
  ChevronRight,
  MessageSquareHeart,
  Ticket,
  Mail,
  X,
} from 'lucide-react';

// VWorld Leaflet 지도 (SSR 비활성화)
const VWorldMap = dynamic(() => import('../components/VWorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
      지도를 불러오는 중...
    </div>
  ),
});

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const REGIONS = [
  '전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function HomePage() {
  const [stores, setStores] = useState<LottoStore[]>([]);
  const [historyData, setHistoryData] = useState<LottoDrawHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // 메인 기본 탭: 1순위 번호 뽑기!
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');
  const [selectedStore, setSelectedStore] = useState<LottoStore | null>(null);
  const [linkedStore, setLinkedStore] = useState<LottoStore | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 순위 탭 필터
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedGrade, setSelectedGrade] = useState<StoreGrade | '전체'>('전체');
  const [rankingPeriod, setRankingPeriod] = useState<PeriodFilter>('all');
  const [sortBy, setSortBy] = useState<'count' | 'distance'>('count');

  // 문의하기 모달 (애니맵·위집 동일 규격 2-Tab + 실제 메일 발송)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'general' | 'ad'>('general');
  const [contactTitle, setContactTitle] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactText, setContactText] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [storesRes, historyRes] = await Promise.all([
          fetch('/data/lotto_stores_compact.json'),
          fetch('/data/lotto_history.json'),
        ]);
        if (storesRes.ok) setStores(await storesRes.json());
        if (historyRes.ok) setHistoryData(await historyRes.json());
      } catch (err) {
        console.error('Failed to load lotto data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRequestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보(GPS)를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setStores((prev) =>
          prev.map((s) => ({
            ...s,
            distance: getDistanceKm(latitude, longitude, s.lat, s.lng),
          }))
        );
        setSortBy('distance');
      },
      () => {
        alert('위치 권한을 허용하시면 내 주변 1등 명당을 바로 찾아드릴 수 있습니다.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const getStorePeriodCnt = (s: LottoStore, p: PeriodFilter) => {
    if (p === '1y') return s.c1y || 0;
    if (p === '6m') return s.c6m || 0;
    if (p === '3m') return s.c3m || 0;
    return s.cnt;
  };

  const filteredStores = useMemo(() => {
    return stores
      .filter((s) => {
        if (rankingPeriod !== 'all' && getStorePeriodCnt(s, rankingPeriod) <= 0) return false;
        if (selectedRegion !== '전체' && !s.reg.includes(selectedRegion)) return false;
        if (selectedGrade !== '전체' && s.grd !== selectedGrade) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          return s.name.toLowerCase().includes(q) || s.addr.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        const diff = getStorePeriodCnt(b, rankingPeriod) - getStorePeriodCnt(a, rankingPeriod);
        if (diff !== 0) return diff;
        return b.cnt - a.cnt;
      })
      .slice(0, 100);
  }, [stores, rankingPeriod, selectedRegion, selectedGrade, searchQuery, sortBy]);

  const handleGenerateWithStore = (store: LottoStore) => {
    setLinkedStore(store);
    setSelectedStore(null);
    setActiveTab('generator');
  };

  const handleViewOnMap = (store: LottoStore) => {
    setSelectedStore(store);
    setActiveTab('map');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black text-2xl animate-pulse">
          L
        </div>
        <p className="text-sm font-bold text-slate-600">로또 명당 데이터 불러오는 중...</p>
      </div>
    );
  }

  const latestDraw = historyData[0];
  const latestDateStr = latestDraw?.date ? latestDraw.date.slice(0, 10).replace(/-/g, '.') : '2026.11.21';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      {/* 1. 실시간 안내 바 */}
      <WinningTicker
        latestDrawNo={latestDraw?.draw_no || 1251}
        latestPrize={latestDraw?.divisions?.[0]?.prize || 2068843286}
        totalStoresCount={stores.length}
      />

      {/* 2. 상단 브랜드 & 네비게이션 (모바일 1줄 컴팩트 + PC 1줄) */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* 로고 */}
          <div
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#10b981] flex items-center justify-center text-white font-black text-base sm:text-xl">
              L
            </div>
            <span className="font-black text-slate-900 text-base sm:text-2xl tracking-tight">
              로또명당
            </span>
          </div>

          {/* 4대 메인 탭 (모바일에서도 로고 바로 옆 1줄에 표시 + 초소형 화면 가로 스크롤) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                activeTab === 'generator'
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
              <span>번호뽑기</span>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                activeTab === 'ranking'
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
              <span>명당순위</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                activeTab === 'map'
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
              <span>명당지도</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" strokeWidth={1.75} />
              <span>당첨번호</span>
            </button>
          </nav>

          {/* 문의하기 버튼 (PC 전용: 모바일에서는 최하단 푸터로 이동) */}
          <button
            onClick={() => {
              setContactSent(false);
              setContactError(null);
              setContactTitle('');
              setContactInfo('');
              setContactCompany('');
              setContactText('');
              setShowContactModal(true);
            }}
            className="hidden md:flex px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold items-center gap-1.5 shrink-0 transition-colors"
          >
            <Mail className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>문의하기</span>
          </button>
        </div>
      </header>

      {/* 3. 메인 컨텐츠 영역 (모바일 하단 탭 바 높이 pb-16 확보) */}
      <main className="flex-1 overflow-y-auto relative pb-16 sm:pb-0">
        {/* [TAB 1] 번호 뽑기 (메인 첫 화면) */}
        {activeTab === 'generator' && (
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 좌측 메인: 로또 번호 발행기 (7칸) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  이번 주 로또 번호 뽑기
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  원하는 방식을 누르거나 직접 숫자를 찍어 번호를 만드세요.
                </p>
              </div>

              <LottoGenerator
                stores={stores}
                historyData={historyData}
                linkedStore={linkedStore}
                onSelectLinkedStore={setLinkedStore}
              />
            </div>

            {/* 우측 보조: 최근 5회차 1등 당첨 번호 + 전국 TOP 5 명당 + 지도 바로가기 (5칸) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* 최근 5회차 1등 당첨 번호 */}
              {historyData.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      최근 5회차 1등 당첨 번호
                    </h3>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center"
                    >
                      전체 보기 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {historyData.slice(0, 5).map((draw) => (
                      <div
                        key={draw.draw_no}
                        className="py-2.5 flex items-center justify-between gap-2 flex-wrap"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {draw.draw_no}회
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {draw.date.slice(2, 10)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {draw.numbers.map((n) => (
                            <span
                              key={n}
                              className={`lotto-ball w-7 h-7 text-xs font-black ${getBallColorClass(
                                n
                              )}`}
                            >
                              {n}
                            </span>
                          ))}
                          <span className="text-slate-400 font-bold text-xs mx-0.5">+</span>
                          <span
                            className={`lotto-ball w-7 h-7 text-xs font-black ring-2 ring-amber-400 ${getBallColorClass(
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
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-slate-700" />
                    <span>전국 1등 명당 TOP 5</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('ranking')}
                    className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center"
                  >
                    전체 순위 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {stores.slice(0, 5).map((store, i) => (
                    <div
                      key={store.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900">{i + 1}위</span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {store.name}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                            {store.cnt}회
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 truncate mt-1">{store.addr}</p>
                      </div>
                      <button
                        onClick={() => handleGenerateWithStore(store)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shrink-0"
                      >
                        기운받기
                      </button>
                    </div>
                  ))}
                </div>

                {/* 내 주변 명당 지도 바로가기 (메인 컬러 #10b981 통일) */}
                <button
                  onClick={() => {
                    setActiveTab('map');
                    handleRequestUserLocation();
                  }}
                  className="w-full mt-4 py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <MapIcon className="w-5 h-5" strokeWidth={1.75} />
                  <span>내 주변 명당 지도 보기</span>
                </button>
              </div>

              {/* 지역별 명당 & 가이드 SEO 내부 링크 허브 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-extrabold text-slate-900">지역별 로또 명당</h3>
                  <a
                    href="/guide"
                    className="text-sm font-bold text-[#10b981] hover:underline"
                  >
                    당첨 가이드 &rarr;
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['서울', 'seoul'], ['경기', 'gyeonggi'], ['부산', 'busan'], ['인천', 'incheon'],
                    ['대구', 'daegu'], ['대전', 'daejeon'], ['광주', 'gwangju'], ['울산', 'ulsan'],
                    ['강원', 'gangwon'], ['충북', 'chungbuk'], ['충남', 'chungnam'], ['전북', 'jeonbuk'],
                    ['전남', 'jeonnam'], ['경북', 'gyeongbuk'], ['경남', 'gyeongnam'], ['제주', 'jeju'],
                  ].map(([name, slug]) => (
                    <a
                      key={slug}
                      href={`/region/${slug}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* [TAB 2] 명당 순위 (TOP 100 & 지역 필터) */}
        {activeTab === 'ranking' && (
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">전국 로또 1등 명당 순위</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {latestDateStr} ({latestDraw?.draw_no || 1251}회) 기준 업데이트 · 역대 1등 배출 TOP 100
                </p>
              </div>
              <button
                onClick={handleRequestUserLocation}
                className="px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                <Crosshair className="w-4 h-4" strokeWidth={1.75} />
                <span>내 주변 가까운순 정렬</span>
              </button>
            </div>

            {/* 검색 & 필터 바 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
              {/* 기간 선택 탭 */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { label: '전체 누적', val: 'all' as const },
                  { label: '최근 1년', val: '1y' as const },
                  { label: '최근 6개월', val: '6m' as const },
                  { label: '최근 3개월', val: '3m' as const },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setRankingPeriod(opt.val)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold shrink-0 transition-colors ${
                      rankingPeriod === opt.val
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="동네(강남, 노원, 부산) 또는 판매점명 검색"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
                    aria-label="검색어 지우기"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {REGIONS.map((reg) => (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shrink-0 transition-colors ${
                      selectedRegion === reg
                        ? 'bg-[#10b981] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(['전체', '다이아', '골드', '실버'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold ${
                        selectedGrade === g
                          ? 'bg-[#10b981] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {g === '다이아' ? '15회+' : g === '골드' ? '10회+' : g === '실버' ? '5회+' : '전체'}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'count' | 'distance')}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                >
                  <option value="count">1등 많은순</option>
                  <option value="distance" disabled={!userLocation}>
                    {userLocation ? '내 주변 가까운순' : '가까운순 (GPS필요)'}
                  </option>
                </select>
              </div>
            </div>

            {/* 명당 카드 리스트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
              {filteredStores.map((store, idx) => (
                <React.Fragment key={store.id}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-3.5 hover:border-[#10b981] transition-all shadow-xs">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                              idx < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 truncate">
                            {store.name}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-sm font-extrabold shrink-0">
                          <Award className="w-4 h-4" />
                          {rankingPeriod === '1y'
                            ? `최근 1년 ${store.c1y || 0}회`
                            : rankingPeriod === '6m'
                            ? `최근 6개월 ${store.c6m || 0}회`
                            : rankingPeriod === '3m'
                            ? `최근 3개월 ${store.c3m || 0}회`
                            : `1등 ${store.cnt}회`}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5 truncate mb-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{store.addr}</span>
                      </p>
                      <div className="text-sm text-slate-600 font-semibold flex items-center justify-between">
                        <span>
                          총 {store.cnt}회 (자동 {store.auto} · 수동 {store.cnt - store.auto})
                        </span>
                        {store.distance !== undefined && (
                          <span className="font-bold text-[#10b981]">
                            {store.distance < 1
                              ? `${Math.round(store.distance * 1000)}m`
                              : `${store.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => handleGenerateWithStore(store)}
                        className="py-2.5 px-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>번호 뽑기</span>
                      </button>
                      <button
                        onClick={() => handleViewOnMap(store)}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MapIcon className="w-4 h-4" />
                        <span>지도 보기</span>
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* [TAB 3] 명당 지도 (애니맵 VWorld + Leaflet 풀스크린) */}
        {activeTab === 'map' && (
          <div className="w-full h-full relative">
            <VWorldMap
              stores={stores}
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
              userLocation={userLocation}
              onRequestUserLocation={handleRequestUserLocation}
              latestDate={latestDateStr}
            />
            <StoreDetailSheet
              store={selectedStore}
              onClose={() => setSelectedStore(null)}
              onGenerateWithStore={handleGenerateWithStore}
            />
          </div>
        )}

        {/* [TAB 4] 당첨 결과 & 성지 후기 */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
            <LottoHistory historyData={historyData} />

            {/* 추후 확장용 명당 성지 후기 게시판 준비 안내 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#10b981] flex items-center justify-center mx-auto mb-2">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                로또 명당 성지 인증 &amp; 당첨 후기 게시판 (오픈 예정)
              </h4>
              <p className="text-xs text-slate-500">
                우리 사이트에서 번호를 뽑아 당첨된 회원님들의 영수증 인증과 전국 명당 방문 꿀팁을 공유하는 커뮤니티가 곧 오픈됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 하단 푸터 & 모바일 전용 문의하기 버튼 */}
        {activeTab !== 'map' && (
          <footer className="max-w-5xl mx-auto px-4 py-8 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">로또명당</span>
              <span>·</span>
              <a href="/guide" className="hover:text-slate-900 font-medium">
                당첨 가이드
              </a>
            </div>
            <button
              onClick={() => {
                setContactSent(false);
                setContactError(null);
                setContactTitle('');
                setContactInfo('');
                setContactCompany('');
                setContactText('');
                setShowContactModal(true);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-600" strokeWidth={1.75} />
              <span>간편 문의 · 광고 제휴하기</span>
            </button>
          </footer>
        )}
      </main>

      {/* 문의하기 모달 (애니맵·위집 동일 규격 2-Tab + 실시간 메일 발송) */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">빠른 간편 문의 &amp; 제안</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  회원가입 없이 연락처와 내용만 남기시면 확인 후 신속히 회신드립니다.
                </p>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSent ? (
              <div className="py-10 text-center">
                <p className="text-lg font-black text-[#10b981] mb-2">
                  문의가 정상적으로 접수되었습니다.
                </p>
                <p className="text-sm text-slate-600 mb-6">
                  기재해 주신 연락처로 확인 후 빠르게 답변드리겠습니다. 감사합니다.
                </p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold"
                >
                  닫기
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!contactInfo.trim() || !contactText.trim() || contactSending) return;
                  setContactSending(true);
                  setContactError(null);
                  try {
                    const res = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: contactType,
                        title: contactTitle,
                        contact: contactInfo,
                        company: contactCompany,
                        message: contactText,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      setContactSent(true);
                    } else {
                      setContactError(data.error || '문의 발송 중 오류가 발생했습니다.');
                    }
                  } catch {
                    setContactError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
                  } finally {
                    setContactSending(false);
                  }
                }}
                className="flex flex-col gap-3"
              >
                {/* 2-Tab 선택 */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setContactType('general')}
                    className={`py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-colors ${
                      contactType === 'general'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    일반 문의 · 판매점 제보
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType('ad')}
                    className={`py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-colors ${
                      contactType === 'ad'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    광고 · 비즈니스 제휴
                  </button>
                </div>

                {contactType === 'ad' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">업체명 / 담당자명</label>
                    <input
                      type="text"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      placeholder="예: (주)OOO 마케팅팀"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    회신받으실 연락처 (이메일 또는 휴대폰 번호) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="예: name@example.com 또는 010-1234-5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">문의 제목</label>
                  <input
                    type="text"
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder={
                      contactType === 'ad'
                        ? '예: 배너 광고 및 제휴 문의드립니다'
                        : '예: 판매점 위치 수정 또는 기능 제안'
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    문의 내용 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={contactText}
                    onChange={(e) => setContactText(e.target.value)}
                    placeholder="자세한 문의 내용을 입력해 주세요."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    required
                  />
                </div>

                {contactError && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                    {contactError}
                  </p>
                )}

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-extrabold disabled:opacity-50"
                  >
                    {contactSending ? '전송 중...' : '문의 접수하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* 모바일 전용 하단 고정 탭 바 (토스/네이버지도 스타일, 한 손 조작 최적화) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex flex-col items-center justify-center py-1 flex-1 gap-1 transition-colors ${
            activeTab === 'generator' ? 'text-[#10b981]' : 'text-slate-500'
          }`}
        >
          <Ticket className="w-5 h-5" strokeWidth={activeTab === 'generator' ? 2.5 : 1.75} />
          <span className="text-[11px] font-bold">번호 뽑기</span>
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center justify-center py-1 flex-1 gap-1 transition-colors ${
            activeTab === 'ranking' ? 'text-[#10b981]' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" strokeWidth={activeTab === 'ranking' ? 2.5 : 1.75} />
          <span className="text-[11px] font-bold">명당 순위</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 flex-1 gap-1 transition-colors ${
            activeTab === 'map' ? 'text-[#10b981]' : 'text-slate-500'
          }`}
        >
          <MapIcon className="w-5 h-5" strokeWidth={activeTab === 'map' ? 2.5 : 1.75} />
          <span className="text-[11px] font-bold">명당 지도</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 flex-1 gap-1 transition-colors ${
            activeTab === 'history' ? 'text-[#10b981]' : 'text-slate-500'
          }`}
        >
          <History className="w-5 h-5" strokeWidth={activeTab === 'history' ? 2.5 : 1.75} />
          <span className="text-[11px] font-bold">당첨 번호</span>
        </button>
      </nav>
    </div>
  );
}
