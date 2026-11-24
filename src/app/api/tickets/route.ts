import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      totalGamesCount: 0,
      alerts: [],
    });
  }

  try {
    const [{ count }, { data: alerts }] = await Promise.all([
      supabase.from('generated_tickets').select('*', { count: 'exact', head: true }),
      supabase
        .from('winning_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      connected: true,
      totalGamesCount: (count || 0) * 5,
      alerts: alerts || [],
    });
  } catch {
    return NextResponse.json({
      connected: false,
      totalGamesCount: 0,
      alerts: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drawNo, games, mode, storeName } = body;

    // Vercel/프록시 헤더에서 접속 지역 추정
    const city = request.headers.get('x-vercel-ip-city');
    const region = city ? decodeURIComponent(city) : '대한민국';

    if (supabase) {
      await supabase.from('generated_tickets').insert({
        draw_no: drawNo,
        games,
        mode,
        store_name: storeName || null,
        region,
      });
    }

    return NextResponse.json({
      ok: true,
      saved: Boolean(supabase),
      drawNo,
      count: Array.isArray(games) ? games.length : 0,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
