import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1순위 대표님 네이버 공식 이메일 (Base64 보관)
const NAVER_EMAIL_DEST = Buffer.from('eW1qY29rckBuYXZlci5jb20=', 'base64').toString('utf-8');
const FORMSPREE_NAVER_ENDPOINT = 'https://formspree.io/f/xaqlbwqy';

// 2순위 구글 백업 이메일
const GMAIL_DEST = Buffer.from('am95a29yZWE3QGdtYWlsLmNvbQ==', 'base64').toString('utf-8');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = 'general', title = '', contact = '', company = '', message = '' } = body;

    const trimmedContact = String(contact).trim();
    const trimmedMessage = String(message).trim();
    const trimmedCompany = String(company).trim();
    const trimmedTitle = String(title).trim();

    if (!trimmedContact || !trimmedMessage) {
      return NextResponse.json(
        { success: false, error: '회신 연락처와 문의 내용을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const isAd = type === 'ad';
    const typeLabel = isAd ? '광고·제휴문의' : '일반문의';
    const defaultTitle = isAd ? '광고 및 비즈니스 제휴 제안' : '판매점 제보 및 서비스 이용 문의';
    const finalTitle = trimmedTitle || defaultTitle;

    // 출처 3중 각인 규격 ([로또명당 lotto.animap.co.kr])
    const senderName = `[로또명당 lotto.animap.co.kr] ${typeLabel}`;
    const mailSubject = isAd
      ? `[로또명당 lotto.animap.co.kr] 광고문의: ${trimmedCompany ? `[${trimmedCompany}] ` : ''}${finalTitle}`
      : `[로또명당 lotto.animap.co.kr] 일반문의: ${finalTitle}`;

    const nowStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const payload: Record<string, string> = {
      name: senderName,
      _subject: mailSubject,
      사이트출처: '로또명당 (lotto.animap.co.kr) - 전국 로또 명당 지도 & 번호 생성기',
      문의유형: isAd ? '광고 및 비즈니스 제휴 문의' : '일반 문의 (판매점 정보 수정 / 오류 제보)',
      ...(isAd ? { 업체명: trimmedCompany || '(미입력)' } : {}),
      문의제목: finalTitle,
      회신연락처: trimmedContact,
      문의내용: trimmedMessage,
      접수일시: nowStr,
      email: trimmedContact.includes('@') ? trimmedContact : 'inquiry@animap.co.kr',
      _replyto: trimmedContact.includes('@') ? trimmedContact : 'inquiry@animap.co.kr',
    };

    const emailPromises = [
      // 채널 1: Formspree 즉각 발송
      fetch(FORMSPREE_NAVER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null),

      // 채널 2: ShipMyForm -> Gmail
      fetch(`https://shipmyform.com/to/${GMAIL_DEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://lotto.animap.co.kr',
          Referer: 'https://lotto.animap.co.kr/',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      // 채널 3: ShipMyForm -> Naver
      fetch(`https://shipmyform.com/to/${NAVER_EMAIL_DEST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://lotto.animap.co.kr',
          Referer: 'https://lotto.animap.co.kr/',
        },
        body: JSON.stringify(payload),
      }).catch(() => null),

      // 채널 4: FormSubmit -> Naver
      fetch(`https://formsubmit.co/ajax/${NAVER_EMAIL_DEST}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null),
    ];

    const results = await Promise.allSettled(emailPromises);
    const hasEmailSent = results.some(
      (r) => r.status === 'fulfilled' && r.value && (r.value as Response).ok
    );

    if (!hasEmailSent) {
      return NextResponse.json(
        {
          success: false,
          error: '일시적인 전송 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '문의가 정상적으로 접수되었습니다. 남겨주신 연락처로 신속히 회신드리겠습니다.',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: '문의 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
