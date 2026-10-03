export type AlertAudience = 'resident' | 'tourist';
export type AlertCategory = 'sms' | 'atm' | 'qr' | 'call' | 'exchange';
export type LearnScenario = 'atm' | 'qr' | 'call';
export type CheckChannel = 'web' | 'sms';

export interface AlertLocalizedContent {
  title: string;
  signs: string[];
  action: string;
  summary: string;
}

export interface AlertItem {
  id: string;
  audience: AlertAudience[];
  category: AlertCategory;
  evergreen: boolean;
  publishedAt: string; // YYYY-MM-DD
  source: {
    name: string | null;
    url: string | null;
  };
  verified: boolean;
  i18n: {
    vi: AlertLocalizedContent;
    en: AlertLocalizedContent;
    ja?: AlertLocalizedContent;
    ko?: AlertLocalizedContent;
    zh?: AlertLocalizedContent;
  };
  related: {
    learnScenario: LearnScenario | null;
    checkChannel: CheckChannel | null;
  };
}
