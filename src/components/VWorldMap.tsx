'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
import { LottoStore, PeriodFilter } from '../types/lotto';
import { Crosshair, Plus, Minus, RotateCcw, Layers, Search, RefreshCw, Award } from 'lucide-react';

interface VWorldMapProps {
  stores: LottoStore[];
  selectedStore: LottoStore | null;
  onSelectStore: (store: LottoStore | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
  latestDate?: string;
}

function getPeriodCount(s: LottoStore, period: PeriodFilter): number {
  if (period === '1y') return s.c1y || 0;
  if (period === '6m') return s.c6m || 0;
  if (period === '3m') return s.c3m || 0;
  return s.cnt;
}

export default function VWorldMap({
  stores,
  selectedStore,
  onSelectStore,
  userLocation,
  onRequestUserLocation,
  latestDate = '2026.11.21',
}: VWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const lastPannedStoreIdRef = useRef<string | null>(null);
  const renderMarkersRef = useRef<() => void>(() => {});

  const [mapType, setMapType] = useState<'BASE' | 'HYBRID'>('BASE');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [minWins, setMinWins] = useState<number>(0); // 0=전체, 3, 5, 10, 15
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [areaTopStores, setAreaTopStores] = useState<LottoStore[] | null>(null);

  // 기간 + 최소 당첨횟수 + 검색어 필터링 (검색 시 해당 장소들만 깔끔하게 유지)
  const visibleStores = useMemo(() => {
    return stores.filter((s) => {
      const pCount = getPeriodCount(s, period);
      if (period !== 'all' && pCount <= 0) return false;
      if (minWins > 0 && pCount < minWins) return false;
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.addr.toLowerCase().includes(q);
      }
      return true;
    });
  }, [stores, period, minWins, activeSearch]);

  // Supercluster 인덱스
  const clusterIndex = useMemo(() => {
    if (!visibleStores.length) return null;
    const points = visibleStores.map((s) => ({
      type: 'Feature' as const,
      properties: { cluster: false, store: s },
      geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
    }));
    const sc = new Supercluster({ radius: 55, maxZoom: 17, minPoints: 2 });
    sc.load(points);
    return sc;
  }, [visibleStores]);

  // 마커 렌더링
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (!clusterIndex) return;

    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = Math.min(17, Math.max(0, Math.floor(map.getZoom())));
    const clusters = clusterIndex.getClusters(bbox, zoom);

    clusters.forEach((feat) => {
      const [lng, lat] = feat.geometry.coordinates;
      const isCluster = feat.properties.cluster;

      if (isCluster) {
        const count = feat.properties.point_count;
        const countAbbr = feat.properties.point_count_abbreviated;
        const clusterId = feat.properties.cluster_id;

        let size = 38;
        let bg = '#10b981';
        if (count >= 50) { size = 46; bg = '#059669'; }
        if (count >= 200) { size = 54; bg = '#047857'; }

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.22);cursor:pointer;">${countAbbr}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => {
          const nextZoom = Math.min(17, clusterIndex.getClusterExpansionZoom(clusterId));
          map.flyTo([lat, lng], nextZoom, { duration: 0.4 });
        });
        group.addLayer(marker);
      } else {
        const store: LottoStore = feat.properties.store;
        const isSelected = selectedStore?.id === store.id;
        const displayCnt = getPeriodCount(store, period);
        const periodTag = period === '1y' ? '1년' : period === '6m' ? '6개월' : period === '3m' ? '3개월' : '1등';

        let html = '';
        if ((period === 'all' && store.grd === '다이아') || (period !== 'all' && displayCnt >= 3)) {
          html = `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;transform:${isSelected ? 'scale(1.18)' : 'scale(1)'};">
              <div style="background:#0f172a;color:#fff;border:2px solid #10b981;padding:4px 8px;border-radius:10px;font-size:12px;font-weight:800;box-shadow:0 4px 10px rgba(0,0,0,0.28);display:flex;align-items:center;gap:4px;white-space:nowrap;">
                <span>${store.name}</span>
                <span style="background:#10b981;color:#fff;padding:1px 6px;border-radius:6px;font-size:11px;">${periodTag} ${displayCnt}회</span>
              </div>
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #0f172a;margin-top:-1px;"></div>
            </div>
          `;
        } else if ((period === 'all' && (store.grd === '골드' || store.grd === '실버')) || (period !== 'all' && displayCnt >= 2)) {
          html = `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;transform:${isSelected ? 'scale(1.18)' : 'scale(1)'};">
              <div style="background:#fff;color:#0f172a;border:2px solid #10b981;padding:3px 7px;border-radius:10px;font-size:12px;font-weight:700;box-shadow:0 3px 8px rgba(0,0,0,0.16);display:flex;align-items:center;gap:4px;white-space:nowrap;">
                <span>${store.name}</span><span style="color:#059669;font-weight:800;">${displayCnt}회</span>
              </div>
              <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #10b981;margin-top:-1px;"></div>
            </div>
          `;
        } else {
          html = `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;transform:${isSelected ? 'scale(1.18)' : 'scale(1)'};">
              <div style="background:${isSelected ? '#0f172a' : '#10b981'};color:#fff;border:2px solid #fff;padding:2px 7px;border-radius:9999px;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.22);white-space:nowrap;">
                ${activeSearch ? store.name + ' · ' : ''}${periodTag} ${displayCnt}회
              </div>
            </div>
          `;
        }

        const icon = L.divIcon({
          className: '',
          html,
          iconSize: [0, 0],
          iconAnchor: [0, 12],
        });

        const marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : displayCnt >= 10 ? 300 : 10,
        });
        marker.on('click', () => {
          lastPannedStoreIdRef.current = store.id;
          onSelectStore(store);
          map.panTo([lat, lng], { animate: true });
        });
        group.addLayer(marker);
      }
    });
  }, [clusterIndex, selectedStore, onSelectStore, period, activeSearch]);

  // 최신 renderMarkers 참조 유지 (드래그/줌 시 옛 클로저 방지)
  useEffect(() => {
    renderMarkersRef.current = renderMarkers;
  }, [renderMarkers]);

  // 지도 초기화
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.5665, 126.9780],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    const baseLayer = L.tileLayer(
      'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
      { maxZoom: 19, subdomains: [] }
    ).addTo(map);
    tileLayerRef.current = baseLayer;

    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    mapRef.current = map;

    map.on('moveend zoomend', () => renderMarkersRef.current());
    map.on('dragend', () => setShowSearchHere(true));
    map.on('zoomend', () => setShowSearchHere(true));
    setTimeout(() => renderMarkersRef.current(), 50);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 타일 전환
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;
    map.removeLayer(tileLayerRef.current);
    const url =
      mapType === 'HYBRID'
        ? 'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg'
        : 'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png';
    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19, subdomains: [] }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [mapType]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStore) return;
    if (lastPannedStoreIdRef.current !== selectedStore.id) {
      lastPannedStoreIdRef.current = selectedStore.id;
      map.flyTo([selectedStore.lat, selectedStore.lng], 15, { duration: 0.5 });
    }
  }, [selectedStore]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 9,
      fillColor: '#10b981',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(map);
    map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.5 });
  }, [userLocation]);

  // 검색 실행 (검색된 장소들만 지도에 남기고 이동, 드래그해도 유지됨)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setActiveSearch(q);
    setAreaTopStores(null);

    if (!q || !mapRef.current) return;
    const matched = stores.filter((s) => {
      const pCount = getPeriodCount(s, period);
      if (period !== 'all' && pCount <= 0) return false;
      if (minWins > 0 && pCount < minWins) return false;
      return s.name.toLowerCase().includes(q.toLowerCase()) || s.addr.toLowerCase().includes(q.toLowerCase());
    });

    if (matched.length > 0) {
      const top = matched.sort((a, b) => getPeriodCount(b, period) - getPeriodCount(a, period))[0];
      lastPannedStoreIdRef.current = top.id;
      mapRef.current.flyTo([top.lat, top.lng], 14, { duration: 0.5 });
      onSelectStore(top);
    } else {
      alert('검색된 판매점이 없습니다.');
    }
  };

  // 현 지도에서 검색 핸들러
  const handleSearchThisArea = () => {
    const map = mapRef.current;
    if (!map) return;
    setShowSearchHere(false);
    const b = map.getBounds();
    const inView = visibleStores
      .filter((s) => b.contains([s.lat, s.lng]))
      .sort((a, b) => getPeriodCount(b, period) - getPeriodCount(a, period));

    setAreaTopStores(inView.slice(0, 5));
    renderMarkers();
  };

  return (
    <div className="relative w-full h-full bg-slate-100">
      <div ref={containerRef} className="w-full h-full z-10" />

      {/* 상단 좌측: 검색바 + 기간별 필터 + 1등 횟수 필터 */}
      <div className="absolute left-3.5 right-3.5 sm:right-auto top-3.5 z-20 flex flex-col gap-2 max-w-md">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-slate-200 p-1.5">
          <Search className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value === '') setActiveSearch('');
            }}
            placeholder="동네(강남, 노원) 또는 판매점 검색"
            className="w-full text-sm font-medium text-slate-800 px-1.5 py-1 focus:outline-none"
          />
          {activeSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActiveSearch('');
                onSelectStore(null);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 bg-rose-50 rounded-lg shrink-0"
            >
              전체보기
            </button>
          )}
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs sm:text-sm font-extrabold rounded-lg shrink-0 transition-colors"
          >
            검색
          </button>
        </form>

        {/* 기간별 필터 (전체 / 최근 1년 / 6개월 / 3개월) */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { label: '전체 누적', val: 'all' as const },
            { label: '최근 1년', val: '1y' as const },
            { label: '최근 6개월', val: '6m' as const },
            { label: '최근 3개월', val: '3m' as const },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => {
                setPeriod(opt.val);
                setMinWins(0);
                setAreaTopStores(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold shrink-0 transition-colors ${
                period === opt.val
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 당첨 횟수별 필터 (전체 누적 모드일 때 주로 3/5/10/15+, 기간 모드일 때는 1/2/3+) */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
          {(period === 'all'
            ? [
                { label: `전체 (${visibleStores.length.toLocaleString()})`, val: 0 },
                { label: '3회+', val: 3 },
                { label: '5회+', val: 5 },
                { label: '10회+', val: 10 },
                { label: '15회+', val: 15 },
              ]
            : [
                { label: `전체 (${visibleStores.length.toLocaleString()})`, val: 0 },
                { label: '2회 이상', val: 2 },
                { label: '3회 이상', val: 3 },
              ]
          ).map((opt) => (
            <button
              key={opt.val}
              onClick={() => {
                setMinWins(opt.val);
                setAreaTopStores(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold shrink-0 transition-colors ${
                minWins === opt.val
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 중앙: 현 지도에서 명당 검색 플로팅 버튼 */}
      {showSearchHere && !areaTopStores && !selectedStore && (
        <button
          onClick={handleSearchThisArea}
          className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20 px-5 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-full shadow-lg text-sm font-extrabold flex items-center gap-2 transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>현 지도에서 명당 검색</span>
        </button>
      )}

      {/* 현 지도 내 TOP 명당 결과 미니 카드 (하단 좌측) */}
      {areaTopStores && !selectedStore && (
        <div className="absolute left-3.5 bottom-8 right-16 sm:right-auto sm:w-96 z-20 bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-extrabold text-slate-900">
              현재 화면 내 주요 명당 ({areaTopStores.length}곳)
            </span>
            <button
              onClick={() => setAreaTopStores(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              닫기
            </button>
          </div>
          {areaTopStores.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">현재 지도 영역에 조건에 맞는 명당이 없습니다.</p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {areaTopStores.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    lastPannedStoreIdRef.current = s.id;
                    onSelectStore(s);
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.addr}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#10b981] text-white rounded-full text-xs font-extrabold shrink-0">
                    <Award className="w-3 h-3" /> {getPeriodCount(s, period)}회
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 우측 하단 플로팅 컨트롤 */}
      <div className="absolute right-3.5 bottom-8 z-20 flex flex-col gap-2">
        <button
          onClick={onRequestUserLocation}
          title="내 주변 명당 찾기"
          className="w-11 h-11 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-[#10b981] hover:bg-emerald-50"
        >
          <Crosshair className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMapType((prev) => (prev === 'BASE' ? 'HYBRID' : 'BASE'))}
          title="위성/일반 지도 전환"
          className={`w-11 h-11 rounded-xl shadow-md border flex items-center justify-center ${
            mapType === 'HYBRID'
              ? 'bg-[#10b981] text-white border-[#10b981]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-5 h-5" />
        </button>
        <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-50"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => mapRef.current?.flyTo([37.5665, 126.9780], 11)}
          title="서울 중심으로 초기화"
          className="w-11 h-11 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 하단 크레딧 + 업데이트 날짜 */}
      <div className="absolute left-3 bottom-2 z-20 px-2.5 py-1 bg-white/90 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 pointer-events-none">
        VWorld · 명당 {visibleStores.length.toLocaleString()}곳 · {latestDate} 기준
      </div>
    </div>
  );
}
