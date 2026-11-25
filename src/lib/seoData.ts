import fs from 'fs';
import path from 'path';
import { LottoStore, LottoDrawHistory } from '@/types/lotto';
import areasData from './areas.json';

export interface RegionInfo {
  slug: string;
  name: string;
  fullName: string;
}

export interface AreaInfo {
  slug: string;
  reg: string;
  sig: string;
  regSlug: string;
  count: number;
}

export const REGIONS: RegionInfo[] = [
  { slug: 'seoul', name: '서울', fullName: '서울특별시' },
  { slug: 'gyeonggi', name: '경기', fullName: '경기도' },
  { slug: 'busan', name: '부산', fullName: '부산광역시' },
  { slug: 'incheon', name: '인천', fullName: '인천광역시' },
  { slug: 'daegu', name: '대구', fullName: '대구광역시' },
  { slug: 'daejeon', name: '대전', fullName: '대전광역시' },
  { slug: 'gwangju', name: '광주', fullName: '광주광역시' },
  { slug: 'ulsan', name: '울산', fullName: '울산광역시' },
  { slug: 'sejong', name: '세종', fullName: '세종특별자치시' },
  { slug: 'gangwon', name: '강원', fullName: '강원특별자치도' },
  { slug: 'chungbuk', name: '충북', fullName: '충청북도' },
  { slug: 'chungnam', name: '충남', fullName: '충청남도' },
  { slug: 'jeonbuk', name: '전북', fullName: '전북특별자치도' },
  { slug: 'jeonnam', name: '전남', fullName: '전라남도' },
  { slug: 'gyeongbuk', name: '경북', fullName: '경상북도' },
  { slug: 'gyeongnam', name: '경남', fullName: '경상남도' },
  { slug: 'jeju', name: '제주', fullName: '제주특별자치도' },
];

export const AREAS: AreaInfo[] = areasData as AreaInfo[];

let cachedStores: LottoStore[] | null = null;
let cachedHistory: LottoDrawHistory[] | null = null;

export function getAllStores(): LottoStore[] {
  if (cachedStores) return cachedStores;
  const filePath = path.join(process.cwd(), 'public', 'data', 'lotto_stores_compact.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedStores = JSON.parse(raw) as LottoStore[];
  return cachedStores;
}

export function getAllHistory(): LottoDrawHistory[] {
  if (cachedHistory) return cachedHistory;
  const filePath = path.join(process.cwd(), 'public', 'data', 'lotto_history.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedHistory = JSON.parse(raw) as LottoDrawHistory[];
  return cachedHistory;
}
