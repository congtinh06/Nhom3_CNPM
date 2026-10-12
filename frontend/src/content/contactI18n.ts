import { SupportedLanguage } from '../types';

export interface ContactTranslation {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const CONTACT_TRANSLATIONS: Record<SupportedLanguage, ContactTranslation> = {
  vi: {
    eyebrow: 'HỖ TRỢ & GÓP Ý',
    title: 'Liên hệ',
    subtitle: 'Góp ý, báo lỗi bản dịch, cần hỗ trợ hoặc hợp tác cùng dự án.',
  },
  en: {
    eyebrow: 'SUPPORT & FEEDBACK',
    title: 'Contact',
    subtitle: 'Feedback, translation corrections, support requests, or project collaborations.',
  },
  ja: {
    eyebrow: 'サポート＆ご意見',
    title: 'お問い合わせ',
    subtitle: 'ご意見、誤訳のご指摘、サポートのご依頼、プロジェクトへの協力について。',
  },
  ko: {
    eyebrow: '지원 및 의견',
    title: '문의',
    subtitle: '의견, 번역 오류 제보, 지원 요청 또는 프로젝트 협업 문의.',
  },
};

export function tContact(lang: SupportedLanguage, key: keyof ContactTranslation): string {
  const dict = CONTACT_TRANSLATIONS[lang] || CONTACT_TRANSLATIONS.vi;
  return dict[key] || CONTACT_TRANSLATIONS.vi[key];
}
