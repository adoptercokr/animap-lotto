import React from 'react';
import HomeClient from '@/components/HomeClient';
import { getAllStores, getAllHistory } from '@/lib/seoData';

export default function HomePage() {
  // 초기 화면 즉시 렌더링용 TOP 100 명당 + 당첨 이력만 서버에서 바로 주입 (0ms 로딩)
  const initialStores = getAllStores().slice(0, 100);
  const initialHistory = getAllHistory();

  return <HomeClient initialStores={initialStores} initialHistory={initialHistory} />;
}
