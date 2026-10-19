import { SupportedLanguage } from '../types';
import { formatNarrationNumerals } from './numerals';

export type LocalizedString = Partial<Record<SupportedLanguage, string>> | string | undefined;

export interface PoiSectionInput {
  text?: LocalizedString;
  image?: string;
  caption?: LocalizedString;
  alt?: LocalizedString;
}

export interface PoiSection {
  text: string;
  image: string;
  caption: string;
  alt: string;
}

export interface PoiSectionSource {
  image?: string;
  sections?: PoiSectionInput[] | null;
}

const pick = (value: LocalizedString, lang: SupportedLanguage): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.vi || '';
};

/**
 * Resolve the narration sections for a POI.
 *
 * - When the POI defines `sections`, each one is localized for the current
 *   language (falling back to Vietnamese), with its optional image/caption/alt.
 * - When it does not, the existing full-narration paragraphs are used as-is.
 *   The cover image is attached to the first section only so the same photo is
 *   never repeated down the article.
 */
export function buildPoiSections(
  poi: PoiSectionSource,
  lang: SupportedLanguage,
  fallbackParagraphs: string[]
): PoiSection[] {
  const defined = poi.sections?.filter(Boolean) ?? [];
  if (defined.length > 0) {
    return defined
      .map((section) => ({
        text: formatNarrationNumerals(pick(section.text, lang), lang),
        image: section.image?.trim() || '',
        caption: pick(section.caption, lang),
        alt: pick(section.alt, lang),
      }))
      .filter((section) => section.text.length > 0);
  }

  const cover = poi.image?.trim() || '';
  return (fallbackParagraphs || [])
    .filter((p) => Boolean(p && p.trim()))
    .map((text, idx) => ({
      text: formatNarrationNumerals(text, lang),
      image: idx === 0 ? cover : '',
      caption: '',
      alt: '',
    }));
}
