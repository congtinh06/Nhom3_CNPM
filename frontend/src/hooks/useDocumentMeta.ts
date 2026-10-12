import { useEffect } from 'react';

/**
 * Lightweight hook to safely update document title and meta description
 * without adding external libraries like react-helmet.
 */
export function useDocumentMeta(
  title: string,
  description?: string,
  ogImage?: string | null,
  ogUrl?: string
) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title ? `${title} | Sài Gòn Tourism` : 'Sài Gòn Tourism';

    const setMeta = (attr: 'name' | 'property', key: string, content?: string | null) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      let created = false;
      const original = el?.content ?? null;

      if (content) {
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
          created = true;
        }
        el.content = content;
      }

      return () => {
        if (el) {
          if (created) {
            el.remove();
          } else if (original !== null) {
            el.content = original;
          }
        }
      };
    };

    const cleanups: Array<() => void> = [];

    if (description) {
      cleanups.push(setMeta('name', 'description', description));
      cleanups.push(setMeta('property', 'og:description', description));
    }
    if (title) {
      cleanups.push(setMeta('property', 'og:title', `${title} | Sài Gòn Tourism`));
    }
    if (ogImage) {
      cleanups.push(setMeta('property', 'og:image', ogImage));
    }
    cleanups.push(setMeta('property', 'og:type', 'article'));
    if (ogUrl || typeof window !== 'undefined') {
      cleanups.push(setMeta('property', 'og:url', ogUrl || window.location.href));
    }

    return () => {
      document.title = originalTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [title, description, ogImage, ogUrl]);
}
