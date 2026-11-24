-- ANIMAP LOTTO (lotto.animap.co.kr) 전용 Supabase DB 스키마
-- 무료 Supabase 프로젝트 생성 후 SQL Editor에 그대로 실행하세요.

-- 1. 사이트 내 번호 발행 기록 테이블
CREATE TABLE IF NOT EXISTS generated_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_no INT NOT NULL,
  games JSONB NOT NULL,              -- 5게임 번호 배열 [[1,2,3,4,5,6], ...]
  mode TEXT NOT NULL,                -- 'AI 통계 분석', '1등 패턴 조합', '명당 기운'
  store_name TEXT,                   -- 연동한 명당 이름 (없으면 NULL)
  region TEXT DEFAULT '대한민국',     -- 접속 지역 (예: 서울 노원구)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_draw_no ON generated_tickets(draw_no);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON generated_tickets(created_at DESC);

-- 2. 매주 토요일 자동 대조 당첨 알림 테이블 (1~3등 배출 시 자동 등록)
CREATE TABLE IF NOT EXISTS winning_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_no INT NOT NULL,
  rank INT NOT NULL,                 -- 1, 2, 3등
  region TEXT NOT NULL,              -- 접속 지역
  store_name TEXT,                   -- 연동 명당명 (또는 추첨 방식)
  winning_numbers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 추후 오픈용: 명당 성지 인증 및 당첨 후기 게시판 테이블
CREATE TABLE IF NOT EXISTS store_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  rating INT DEFAULT 5,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS(Row Level Security) 설정: 누구나 읽기/생성 가능 (익명 서비스)
ALTER TABLE generated_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert tickets" ON generated_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read tickets count" ON generated_tickets FOR SELECT USING (true);
CREATE POLICY "Allow public read alerts" ON winning_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read reviews" ON store_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON store_reviews FOR INSERT WITH CHECK (true);
