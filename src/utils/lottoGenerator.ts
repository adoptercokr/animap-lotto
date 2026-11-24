import { LottoDrawHistory } from '../types/lotto';

export function getBallColorClass(num: number): string {
  if (num <= 10) return 'ball-yellow';
  if (num <= 20) return 'ball-blue';
  if (num <= 30) return 'ball-red';
  if (num <= 40) return 'ball-gray';
  return 'ball-green';
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pseudoRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function isValidLottoCombination(nums: number[]): boolean {
  if (nums.length !== 6) return false;
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum < 85 || sum > 190) return false;

  const odds = nums.filter((n) => n % 2 !== 0).length;
  if (odds === 0 || odds === 6) return false;

  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i + 1] === sorted[i] + 1 && sorted[i + 2] === sorted[i] + 2) {
      return false;
    }
  }
  return true;
}

/**
 * 고정수/제외수를 반영한 공통 번호 생성기
 */
export function generateSingleGame(
  mode: 'ai' | 'pattern' | 'store' | 'random',
  history: LottoDrawHistory[] = [],
  storeName?: string,
  storeCount: number = 1,
  fixedNums: number[] = [],
  excludedNums: number[] = [],
  sampleCount: number = 50
): number[] {
  const excludedSet = new Set(excludedNums);
  const baseFixed = fixedNums.filter((n) => !excludedSet.has(n)).slice(0, 5);

  // 가중치 계산 (1등 패턴 모드용: 선택한 최근 N회차 기반)
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) counts[i] = 1;
  if ((mode === 'pattern' || mode === 'ai') && history.length > 0) {
    history.slice(0, sampleCount).forEach((draw) => {
      draw.numbers.forEach((num) => {
        counts[num] = (counts[num] || 1) + 1;
      });
    });
  }

  const rand =
    mode === 'store' && storeName
      ? pseudoRandom(stringToSeed(`${storeName}_${storeCount}_${Date.now()}_${Math.random()}`))
      : Math.random;

  for (let attempt = 0; attempt < 80; attempt++) {
    const selected = new Set<number>(baseFixed);

    // 사용 가능한 숫자 풀 구성
    const availablePool: number[] = [];
    for (let i = 1; i <= 45; i++) {
      if (!selected.has(i) && !excludedSet.has(i)) {
        const w = mode === 'pattern' || mode === 'ai' ? Math.max(1, counts[i] || 1) : 1;
        for (let k = 0; k < w; k++) availablePool.push(i);
      }
    }

    // 1등 패턴 모드: 번호대별 분산 + 통계 가중치 결합
    if (mode === 'pattern' && selected.size < 6) {
      const zones = [
        [1, 10],
        [11, 20],
        [21, 30],
        [31, 40],
        [41, 45],
      ];
      for (const [min, max] of zones) {
        if (selected.size >= 6) break;
        const zoneCandidates: number[] = [];
        for (let n = min; n <= max; n++) {
          if (!selected.has(n) && !excludedSet.has(n)) {
            const w = Math.max(1, counts[n] || 1);
            for (let k = 0; k < w; k++) zoneCandidates.push(n);
          }
        }
        if (zoneCandidates.length > 0) {
          selected.add(zoneCandidates[Math.floor(Math.random() * zoneCandidates.length)]);
        }
      }
    }

    // 나머지 빈 칸 채우기
    let guard = 0;
    while (selected.size < 6 && guard < 200 && availablePool.length > 0) {
      guard++;
      const pick = availablePool[Math.floor(rand() * availablePool.length)];
      selected.add(pick);
    }

    const result = Array.from(selected).sort((a, b) => a - b);
    if (result.length === 6 && isValidLottoCombination(result)) {
      return result;
    }
  }

  // 안전 폴백
  const fallback = new Set<number>(baseFixed);
  while (fallback.size < 6) {
    const n = getRandomInt(1, 45);
    if (!excludedSet.has(n)) fallback.add(n);
  }
  return Array.from(fallback).sort((a, b) => a - b);
}

export function generateLottoSet(
  mode: 'ai' | 'pattern' | 'store' | 'random',
  history: LottoDrawHistory[] = [],
  storeName?: string,
  storeCount: number = 1,
  fixedNums: number[] = [],
  excludedNums: number[] = [],
  sampleCount: number = 50
): number[][] {
  const games: number[][] = [];
  for (let i = 0; i < 5; i++) {
    games.push(
      generateSingleGame(
        mode,
        history,
        storeName ? `${storeName}_${i}` : undefined,
        storeCount,
        fixedNums,
        excludedNums,
        sampleCount
      )
    );
  }
  return games;
}
