export type StoreGrade = '다이아' | '골드' | '실버' | '일반';

export interface LottoStore {
  id: string;
  name: string;
  addr: string;
  lat: number;
  lng: number;
  reg: string;     // 시·도 (서울, 경기 등)
  sig: string;     // 구·군
  cnt: number;     // 전체 누적 1등 당첨 횟수
  c1y?: number;    // 최근 1년(52주) 1등 당첨 횟수
  c6m?: number;    // 최근 6개월(26주) 1등 당첨 횟수
  c3m?: number;    // 최근 3개월(13주) 1등 당첨 횟수
  grd: StoreGrade; // 등급
  auto: number;    // 자동 당첨 수
  man: number;     // 수동 당첨 수
  rec: number[];   // 최근 당첨 회차 3개
  distance?: number; // 내 위치로부터의 거리 (km)
}

export type PeriodFilter = 'all' | '1y' | '6m' | '3m';

export interface LottoDrawHistory {
  draw_no: number;
  numbers: number[];
  bonus_no: number;
  date: string;
  divisions: {
    prize: number;
    winners: number;
  }[];
  total_sales_amount?: number;
  winners_combination?: {
    auto?: number;
    manual?: number;
    semi_auto?: number;
  };
}

export type ActiveTab = 'map' | 'ranking' | 'generator' | 'history';
